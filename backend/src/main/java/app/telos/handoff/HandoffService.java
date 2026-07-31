package app.telos.handoff;

import app.telos.common.BusinessException;
import app.telos.common.IllegalTransitionException;
import app.telos.common.MoneyPolicy;
import app.telos.common.NotFoundException;
import app.telos.domain.StateMachine;
import app.telos.domain.entity.HandoffToken;
import app.telos.domain.entity.Item;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import app.telos.handoff.dto.MintTokenResponse;
import app.telos.handoff.dto.ScanResponse;
import app.telos.repo.HandoffTokenRepository;
import app.telos.repo.ItemRepository;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.WalletRepository;
import app.telos.transaction.LateFeeAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * QR handoff: mints single-use, time-limited tokens and consumes them on scan.
 *
 * Token format: {@code TELOS:<txId>:<random16>:<expiryEpochMillis>}. Only a
 * SHA-256 hash plus transaction/issuer/phase metadata is persisted. A scan
 * row-locks that metadata and marks it consumed in the same database transaction
 * as the lifecycle change and escrow settlement, making tokens single-use across
 * restarts and multiple application instances.
 *
 * On a return scan reaching RETURNED, escrow is settled: the deposit is released
 * back to the borrower (locked -> available, DEPOSIT_RELEASE cleared) and the fee
 * is paid out to the lender (earned += fee, available += fee, PAYOUT cleared).
 */
@Service
public class HandoffService {

    private static final int TTL_SECONDS = 120;
    private static final int RANDOM_TOKEN_LENGTH = 16;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final TransactionRepository transactions;
    private final WalletRepository wallets;
    private final LedgerEntryRepository ledger;
    private final HandoffTokenRepository tokens;
    private final ItemRepository items;
    private final LateFeeAssessmentService lateFees;
    private final Clock clock;

    public HandoffService(TransactionRepository transactions,
                          WalletRepository wallets,
                          LedgerEntryRepository ledger,
                          HandoffTokenRepository tokens,
                          ItemRepository items,
                          LateFeeAssessmentService lateFees,
                          Clock clock) {
        this.transactions = transactions;
        this.wallets = wallets;
        this.ledger = ledger;
        this.tokens = tokens;
        this.items = items;
        this.lateFees = lateFees;
        this.clock = clock;
    }

    @Transactional
    public MintTokenResponse mint(String uid, String transactionId) {
        Transaction tx = transactions.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + transactionId));
        if (!tx.getBorrowerId().equals(uid) && !tx.getLenderId().equals(uid)) {
            throw new NotFoundException("Transaction not found: " + transactionId);
        }

        String phase = switch (tx.getState()) {
            case APPROVED -> "pickup";
            case ACTIVE, OVERDUE -> "return";
            default -> throw new BusinessException("HANDOFF_NOT_READY",
                    "Transaction is not ready for pickup or return",
                    HttpStatus.CONFLICT.value());
        };

        Instant now = clock.instant();
        Instant expiresAt = now.plusSeconds(TTL_SECONDS);
        String token = "TELOS:" + transactionId + ":" + randomTokenPart()
                + ":" + expiresAt.toEpochMilli();

        // Opportunistic expiry cleanup plus one live token per issuer/transaction.
        tokens.deleteByExpiresAtBefore(now);
        tokens.deleteByTransactionIdAndMintedByAndConsumedAtIsNull(transactionId, uid);

        HandoffToken persisted = new HandoffToken();
        persisted.setTokenHash(hashToken(token));
        persisted.setTransactionId(transactionId);
        persisted.setMintedBy(uid);
        persisted.setFromState(tx.getState());
        persisted.setExpiresAt(expiresAt);
        persisted.setConsumedAt(null);
        tokens.save(persisted);

        return new MintTokenResponse(
                transactionId, token, phase, TTL_SECONDS, expiresAt);
    }

    @Transactional
    public ScanResponse scan(String uid, String token) {
        if (token == null || token.isBlank()) {
            throw invalidToken();
        }

        String tokenHash = hashToken(token);
        HandoffToken snapshot = tokens.findById(tokenHash)
                .orElseThrow(HandoffService::invalidToken);
        String txId = parseTxId(token);
        if (!snapshot.getTransactionId().equals(txId)) {
            throw invalidToken();
        }

        // Mint and scan both lock transaction first, then token, avoiding a
        // token<->transaction deadlock while still rejecting unknown hashes early.
        Transaction tx = transactions.findByIdForUpdate(txId)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + txId));
        HandoffToken minted = tokens.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(HandoffService::invalidToken);
        Instant now = clock.instant();
        if (minted.getConsumedAt() != null
                || !minted.getExpiresAt().isAfter(now)
                || !minted.getTransactionId().equals(txId)) {
            throw invalidToken();
        }
        if (!tx.getBorrowerId().equals(uid) && !tx.getLenderId().equals(uid)) {
            throw new NotFoundException("Transaction not found: " + txId);
        }
        if (minted.getMintedBy().equals(uid)) {
            throw new BusinessException("HANDOFF_SELF_SCAN",
                    "The other participant must scan this handoff token",
                    HttpStatus.FORBIDDEN.value());
        }

        TxState from = tx.getState();
        if (from != minted.getFromState()) {
            throw new BusinessException("HANDOFF_TOKEN_STALE",
                    "Handoff token no longer matches the transaction phase",
                    HttpStatus.CONFLICT.value());
        }

        TxState to = switch (from) {
            case APPROVED -> TxState.ACTIVE;
            case ACTIVE, OVERDUE -> TxState.RETURNED;
            default -> null;
        };
        if (to == null || !StateMachine.canTransition(from, to)) {
            throw new IllegalTransitionException(from.name(), to == null ? "?" : to.name());
        }

        Item item = items.findByIdForUpdate(tx.getItemId())
                .orElseThrow(() -> new NotFoundException("Item not found: " + tx.getItemId()));

        // Consumption, lifecycle, listing state, wallet changes, and ledger
        // writes share this transaction. Any failure rolls all of them back.
        minted.setConsumedAt(now);
        tx.setState(to);
        if (to == TxState.ACTIVE) {
            tx.setDueAt(tx.getMode() == Mode.BUY
                    ? null
                    : now.plus(tx.getDays(), ChronoUnit.DAYS));
            item.setState(TxState.ACTIVE);
        } else {
            item.setState(tx.getMode() == Mode.BUY ? TxState.RETURNED : TxState.AVAILABLE);
        }
        if (to == TxState.RETURNED) {
            tx.setReturnedAt(now);
            settleOnReturn(tx, now);
        }
        tokens.save(minted);
        items.save(item);
        transactions.save(tx);

        return new ScanResponse(tx.getId(), tx.getState(), tx.getReturnedAt());
    }

    /** Releases escrow while conserving fee, deposit refund, and any late penalty. */
    private void settleOnReturn(Transaction tx, Instant now) {
        double deposit = MoneyPolicy.requireNonNegative(tx.getDeposit(), "deposit");
        double fee = MoneyPolicy.requireNonNegative(tx.getFee(), "fee");
        double hold = MoneyPolicy.requireNonNegative(
                MoneyPolicy.add(deposit, fee), "escrow hold");

        List<String> userIds = List.of(tx.getBorrowerId(), tx.getLenderId()).stream()
                .distinct()
                .sorted()
                .toList();
        Map<String, Wallet> lockedWallets = wallets.findAllByUserIdInForUpdate(userIds).stream()
                .collect(Collectors.toMap(Wallet::getUserId, Function.identity()));
        Wallet borrower = lockedWallets.get(tx.getBorrowerId());
        Wallet lender = lockedWallets.get(tx.getLenderId());
        if (borrower == null || lender == null) {
            throw new NotFoundException("Wallet not found for handoff transaction: " + tx.getId());
        }

        LedgerEntry escrow = ledger.findByTxIdAndTypeForUpdate(
                        tx.getId(), LedgerType.ESCROW_LOCK)
                .orElseThrow(() -> escrowMismatch(tx));
        boolean invalidEscrow = escrow.getStatus() != LedgerStatus.LOCKED
                || !tx.getBorrowerId().equals(escrow.getUserId())
                || !Double.isFinite(escrow.getAmount())
                || !MoneyPolicy.same(-escrow.getAmount(), hold)
                || !Double.isFinite(borrower.getLocked())
                || borrower.getLocked() < hold
                || !Double.isFinite(borrower.getAvailable())
                || !Double.isFinite(lender.getAvailable())
                || !Double.isFinite(lender.getEarned());
        if (invalidEscrow) {
            throw escrowMismatch(tx);
        }

        LateFeeAssessmentService.Assessment assessment = lateFees.assess(tx, now);
        double penalty = MoneyPolicy.requireNonNegative(assessment.amount(), "late fee");
        LedgerEntry penaltyEntry = assessment.ledgerEntry();
        boolean invalidPenalty = penalty > deposit
                || (penalty == 0.0 && penaltyEntry != null)
                || (penalty > 0.0 && (penaltyEntry == null
                || penaltyEntry.getType() != LedgerType.PENALTY
                || penaltyEntry.getStatus() != LedgerStatus.PENDING
                || !tx.getId().equals(penaltyEntry.getTxId())
                || !tx.getLenderId().equals(penaltyEntry.getUserId())
                || !MoneyPolicy.same(penaltyEntry.getAmount(), penalty)));
        if (invalidPenalty) {
            throw escrowMismatch(tx);
        }

        double borrowerRefund = MoneyPolicy.subtract(deposit, penalty);
        double lenderCredit = MoneyPolicy.requireNonNegative(
                MoneyPolicy.add(fee, penalty), "lender credit");
        if (!MoneyPolicy.same(MoneyPolicy.add(borrowerRefund, lenderCredit), hold)) {
            throw escrowMismatch(tx);
        }

        escrow.setStatus(LedgerStatus.CLEARED);
        ledger.save(escrow);
        if (penaltyEntry != null) {
            penaltyEntry.setStatus(LedgerStatus.CLEARED);
            ledger.save(penaltyEntry);
        }

        borrower.setLocked(MoneyPolicy.subtract(borrower.getLocked(), hold));
        borrower.setAvailable(MoneyPolicy.add(borrower.getAvailable(), borrowerRefund));
        wallets.save(borrower);

        LedgerEntry depRelease = new LedgerEntry();
        depRelease.setId("l-" + shortId());
        depRelease.setUserId(tx.getBorrowerId());
        depRelease.setType(LedgerType.DEPOSIT_RELEASE);
        depRelease.setLabel("Deposit returned — " + tx.getItemTitle());
        depRelease.setAmount(borrowerRefund);
        depRelease.setAt(now);
        depRelease.setStatus(LedgerStatus.CLEARED);
        depRelease.setTxId(tx.getId());
        ledger.save(depRelease);

        if (lenderCredit > 0) {
            lender.setEarned(MoneyPolicy.add(lender.getEarned(), lenderCredit));
            lender.setAvailable(MoneyPolicy.add(lender.getAvailable(), lenderCredit));
            wallets.save(lender);
        }

        if (fee > 0) {
            LedgerEntry payout = new LedgerEntry();
            payout.setId("l-" + shortId());
            payout.setUserId(tx.getLenderId());
            payout.setType(LedgerType.PAYOUT);
            payout.setLabel("Payout — " + tx.getItemTitle());
            payout.setAmount(fee);
            payout.setAt(now);
            payout.setStatus(LedgerStatus.CLEARED);
            payout.setTxId(tx.getId());
            ledger.save(payout);
        }
    }

    private static BusinessException escrowMismatch(Transaction tx) {
        return new BusinessException("ESCROW_MISMATCH",
                "Transaction escrow is missing or inconsistent: " + tx.getId(),
                HttpStatus.CONFLICT.value());
    }

    private static String parseTxId(String token) {
        // TELOS:<txId>:<randomPart>:<expiryMillis>
        String[] parts = token.split(":");
        if (parts.length != 4 || !"TELOS".equals(parts[0])) {
            throw invalidToken();
        }
        return parts[1];
    }

    private static String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private static BusinessException invalidToken() {
        return new BusinessException("TOKEN_EXPIRED",
                "Handoff token is expired, used, or invalid", HttpStatus.GONE.value());
    }

    private static String randomTokenPart() {
        StringBuilder value = new StringBuilder(RANDOM_TOKEN_LENGTH);
        for (int i = 0; i < RANDOM_TOKEN_LENGTH; i++) {
            value.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return value.toString();
    }

    private static String shortId() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
