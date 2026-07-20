package app.telos.wallet;

import app.telos.common.BusinessException;
import app.telos.common.MoneyPolicy;
import app.telos.common.NotFoundException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Verification;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.VerificationKind;
import app.telos.domain.enums.VerificationStatus;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.VerificationRepository;
import app.telos.repo.WalletRepository;
import app.telos.wallet.dto.LedgerEntryDto;
import app.telos.wallet.dto.TopupResponse;
import app.telos.wallet.dto.WalletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Wallet reads + top-up requests.
 *
 * A top-up creates a PENDING TOPUP ledger entry, bumps the wallet's
 * pendingClear balance, and enqueues a RECEIPT verification for an admin to
 * approve. On admin approval (see AdminService) the funds move from
 * pendingClear to available and the ledger entry is marked CLEARED.
 */
@Service
public class WalletService {

    private final WalletRepository wallets;
    private final LedgerEntryRepository ledger;
    private final VerificationRepository verifications;

    public WalletService(WalletRepository wallets,
                         LedgerEntryRepository ledger,
                         VerificationRepository verifications) {
        this.wallets = wallets;
        this.ledger = ledger;
        this.verifications = verifications;
    }

    @Transactional(readOnly = true)
    public WalletResponse get(String uid) {
        Wallet w = wallets.findById(uid)
                .orElseThrow(() -> new NotFoundException("Wallet not found: " + uid));
        List<LedgerEntryDto> entries = new ArrayList<>();
        for (LedgerEntry e : ledger.findByUserIdOrderByAtDesc(uid)) {
            entries.add(new LedgerEntryDto(
                    e.getId(), e.getType(), e.getLabel(), e.getAmount(), e.getAt(), e.getStatus()));
        }
        return new WalletResponse(
                w.getAvailable(), w.getLocked(), w.getEarned(), w.getPendingClear(), entries);
    }

    @Transactional
    public TopupResponse topup(String uid, double amount, String receiptRef) {
        amount = MoneyPolicy.requirePositive(amount, "amount");
        if (receiptRef == null || receiptRef.isBlank() || receiptRef.length() > 248) {
            throw new BusinessException("INVALID_RECEIPT_REF",
                    "Receipt reference must be between 1 and 248 characters",
                    HttpStatus.BAD_REQUEST.value());
        }
        Wallet w = wallets.findByIdForUpdate(uid)
                .orElseThrow(() -> new NotFoundException("Wallet not found: " + uid));

        Instant now = Instant.now();
        String ledgerId = "l-" + shortId();

        LedgerEntry entry = new LedgerEntry();
        entry.setId(ledgerId);
        entry.setUserId(uid);
        entry.setType(LedgerType.TOPUP);
        entry.setLabel("Top-up " + receiptRef);
        entry.setAmount(amount);
        entry.setAt(now);
        entry.setStatus(LedgerStatus.PENDING);
        entry.setTxId(null);

        w.setPendingClear(MoneyPolicy.add(w.getPendingClear(), amount));

        Verification v = new Verification();
        v.setId("vq-" + shortId());
        v.setKind(VerificationKind.RECEIPT);
        v.setUserId(uid);
        v.setSubmittedAt(now);
        v.setAmount(amount);
        v.setDoc("Top-up " + receiptRef);
        v.setStatus(VerificationStatus.PENDING);
        v.setLedgerId(ledgerId);

        ledger.save(entry);
        wallets.save(w);
        verifications.save(v);

        return new TopupResponse(ledgerId, LedgerStatus.PENDING, w.getPendingClear());
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
