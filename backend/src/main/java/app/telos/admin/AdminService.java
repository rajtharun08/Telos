package app.telos.admin;

import app.telos.admin.dto.AdminMetrics;
import app.telos.admin.dto.DecideVerificationResponse;
import app.telos.admin.dto.VerificationDto;
import app.telos.admin.dto.VerificationListResponse;
import app.telos.common.BusinessException;
import app.telos.common.MoneyPolicy;
import app.telos.common.NotFoundException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.entity.User;
import app.telos.domain.entity.Verification;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.TxState;
import app.telos.domain.enums.VerificationKind;
import app.telos.domain.enums.VerificationStatus;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.UserRepository;
import app.telos.repo.VerificationRepository;
import app.telos.repo.WalletRepository;
import app.telos.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Admin verification queue + dashboard metrics.
 *
 * Listing returns the queue (optionally filtered by status) plus computed
 * aggregate metrics. Deciding a verification sets its status; approving a
 * RECEIPT clears the linked PENDING ledger entry (pendingClear -> available)
 * and reports the cleared amount.
 */
@Service
public class AdminService {

    private final VerificationRepository verifications;
    private final LedgerEntryRepository ledger;
    private final WalletRepository wallets;
    private final TransactionRepository transactions;
    private final UserRepository users;
    private final CurrentUser currentUser;

    public AdminService(VerificationRepository verifications,
                        LedgerEntryRepository ledger,
                        WalletRepository wallets,
                        TransactionRepository transactions,
                        UserRepository users,
                        CurrentUser currentUser) {
        this.verifications = verifications;
        this.ledger = ledger;
        this.wallets = wallets;
        this.transactions = transactions;
        this.users = users;
        this.currentUser = currentUser;
    }

    private void requireAdmin() {
        boolean persistedAdmin = currentUser.isAdmin()
                && users.findById(currentUser.id()).map(User::isAdmin).orElse(false);
        if (!persistedAdmin) {
            throw new BusinessException("FORBIDDEN",
                    "Admin role required", HttpStatus.FORBIDDEN.value());
        }
    }

    @Transactional(readOnly = true)
    public VerificationListResponse list(String statusFilter) {
        requireAdmin();
        List<Verification> rows;
        if (statusFilter == null || statusFilter.isBlank() || statusFilter.equalsIgnoreCase("ALL")) {
            rows = verifications.findAllByOrderBySubmittedAtDesc();
        } else {
            try {
                rows = verifications.findByStatusOrderBySubmittedAtDesc(
                        VerificationStatus.valueOf(statusFilter.toUpperCase(java.util.Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new BusinessException("INVALID_STATUS",
                        "Unknown verification status", HttpStatus.BAD_REQUEST.value());
            }
        }
        List<VerificationDto> items = rows.stream().map(this::toDto).toList();
        return new VerificationListResponse(items, computeMetrics());
    }

    @Transactional
    public DecideVerificationResponse decide(String verificationId, String decision) {
        requireAdmin();
        Verification verification = verifications.findByIdForUpdate(verificationId)
                .orElseThrow(() -> new NotFoundException("Verification not found: " + verificationId));

        if (verification.getStatus() != VerificationStatus.PENDING) {
            throw new BusinessException("ALREADY_DECIDED",
                    "Verification has already been decided", HttpStatus.CONFLICT.value());
        }

        VerificationStatus target;
        try {
            target = VerificationStatus.valueOf(
                    decision == null ? "" : decision.toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("INVALID_DECISION",
                    "Decision must be APPROVED or REJECTED", HttpStatus.BAD_REQUEST.value());
        }
        if (target != VerificationStatus.APPROVED && target != VerificationStatus.REJECTED) {
            throw new BusinessException("INVALID_DECISION",
                    "Decision must be APPROVED or REJECTED", HttpStatus.BAD_REQUEST.value());
        }

        Double clearedAmount = null;
        if (verification.getKind() == VerificationKind.RECEIPT) {
            clearedAmount = decideReceiptFunds(verification, target);
        } else if (verification.getKind() == VerificationKind.KYC) {
            decideKycUserState(verification, target);
        }

        verification.setStatus(target);
        verifications.save(verification);
        return new DecideVerificationResponse(
                verification.getId(), verification.getStatus(), clearedAmount);
    }

    private void decideKycUserState(Verification verification, VerificationStatus target) {
        User subject = users.findByIdForUpdate(verification.getUserId())
                .orElseThrow(this::invalidKyc);
        boolean approved = target == VerificationStatus.APPROVED;
        subject.setKycStatus(approved
                ? app.telos.domain.enums.KycStatus.VERIFIED
                : app.telos.domain.enums.KycStatus.REJECTED);
        subject.setVerified(approved);
        users.save(subject);
    }

    private BusinessException invalidKyc() {
        return new BusinessException("INVALID_KYC",
                "KYC verification subject user does not exist",
                HttpStatus.CONFLICT.value());
    }

    /**
     * Resolves only the exact PENDING TOPUP linked to this receipt. Approval
     * credits available funds; rejection removes the pending balance without a
     * credit. All three rows are locked inside the surrounding transaction.
     */
    private Double decideReceiptFunds(Verification verification, VerificationStatus target) {
        if (verification.getLedgerId() == null) {
            throw invalidReceipt();
        }

        LedgerEntry entry = ledger.findByIdForUpdate(verification.getLedgerId())
                .orElseThrow(this::invalidReceipt);
        Double submittedAmount = verification.getAmount();
        double amount = entry.getAmount();
        boolean mismatched = entry.getType() != app.telos.domain.enums.LedgerType.TOPUP
                || entry.getStatus() != LedgerStatus.PENDING
                || !verification.getUserId().equals(entry.getUserId())
                || entry.getTxId() != null
                || submittedAmount == null
                || !MoneyPolicy.isValid(submittedAmount)
                || !MoneyPolicy.isValid(amount)
                || amount <= 0
                || !MoneyPolicy.same(submittedAmount, amount);
        if (mismatched) {
            throw invalidReceipt();
        }

        Wallet wallet = wallets.findByIdForUpdate(verification.getUserId())
                .orElseThrow(this::invalidReceipt);
        if (!Double.isFinite(wallet.getPendingClear())
                || wallet.getPendingClear() < amount
                || !Double.isFinite(wallet.getAvailable())) {
            throw invalidReceipt();
        }

        wallet.setPendingClear(MoneyPolicy.subtract(wallet.getPendingClear(), amount));
        Double clearedAmount = null;
        if (target == VerificationStatus.APPROVED) {
            entry.setStatus(LedgerStatus.CLEARED);
            wallet.setAvailable(MoneyPolicy.add(wallet.getAvailable(), amount));
            clearedAmount = amount;
        } else {
            entry.setStatus(LedgerStatus.REJECTED);
        }

        ledger.save(entry);
        wallets.save(wallet);
        return clearedAmount;
    }

    private BusinessException invalidReceipt() {
        return new BusinessException("INVALID_RECEIPT",
                "Receipt is not linked to matching pending top-up funds",
                HttpStatus.CONFLICT.value());
    }

    /** Standalone accessor for the dashboard-metrics endpoint. */
    @Transactional(readOnly = true)
    public AdminMetrics metrics() {
        requireAdmin();
        return computeMetrics();
    }

    private AdminMetrics computeMetrics() {
        List<Transaction> txs = transactions.findAll();
        long activeRentals = txs.stream()
                .filter(t -> t.getState() == TxState.ACTIVE || t.getState() == TxState.OVERDUE)
                .count();
        double gmv = txs.stream().mapToDouble(Transaction::getFee).sum();

        double escrowHeld = wallets.findAll().stream().mapToDouble(Wallet::getLocked).sum();

        long pendingVerifications = verifications.countByStatus(VerificationStatus.PENDING);

        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long newUsers7d = users.findAll().stream()
                .filter(u -> u.getJoined() != null
                        && u.getJoined().atStartOfDay(java.time.ZoneOffset.UTC).toInstant().isAfter(weekAgo))
                .count();

        long overdue = txs.stream().filter(t -> t.getState() == TxState.OVERDUE).count();
        double disputeRate = txs.isEmpty() ? 0.0
                : Math.round((overdue * 100.0 / txs.size()) * 10.0) / 10.0;

        return new AdminMetrics(activeRentals, escrowHeld, pendingVerifications,
                disputeRate, gmv, newUsers7d);
    }

    private VerificationDto toDto(Verification v) {
        return new VerificationDto(v.getId(), v.getKind(), v.getUserId(),
                v.getSubmittedAt(), v.getAmount(), v.getDoc(), v.getStatus());
    }
}
