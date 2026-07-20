package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.common.MoneyPolicy;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.repo.LedgerEntryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** Creates or refreshes the single pending PENALTY ledger row for a transaction. */
@Service
public class LateFeeAssessmentService {

    private final LedgerEntryRepository ledger;
    private final double dailyPenalty;

    public LateFeeAssessmentService(
            LedgerEntryRepository ledger,
            @Value("${telos.overdue.daily-penalty:5.00}") double dailyPenalty) {
        this.ledger = ledger;
        this.dailyPenalty = MoneyPolicy.requirePositive(dailyPenalty, "daily penalty");
    }

    public Assessment assess(Transaction tx, Instant assessedAt) {
        Objects.requireNonNull(tx, "transaction");
        Objects.requireNonNull(assessedAt, "assessment instant");
        double penalty = LateFeePolicy.calculate(
                tx.getDueAt(), assessedAt, dailyPenalty, tx.getDeposit());
        if (penalty == 0.0) {
            if (tx.getDueAt() != null && tx.getDueAt().isBefore(assessedAt)) {
                tx.setLateFee(0.0);
            }
            return new Assessment(0.0, null);
        }

        LedgerEntry entry = ledger.findByTxIdAndTypeForUpdate(tx.getId(), LedgerType.PENALTY)
                .map(existing -> requirePendingPenalty(tx, existing))
                .orElseGet(() -> newPenalty(tx));
        entry.setLabel("Late fee — " + tx.getItemTitle());
        entry.setAmount(penalty);
        entry.setAt(assessedAt);
        entry.setStatus(LedgerStatus.PENDING);
        tx.setLateFee(penalty);
        ledger.save(entry);
        return new Assessment(penalty, entry);
    }

    private static LedgerEntry requirePendingPenalty(Transaction tx, LedgerEntry entry) {
        boolean inconsistent = entry.getType() != LedgerType.PENALTY
                || entry.getStatus() != LedgerStatus.PENDING
                || !tx.getId().equals(entry.getTxId())
                || !tx.getLenderId().equals(entry.getUserId())
                || !MoneyPolicy.isValid(entry.getAmount())
                || entry.getAmount() <= 0.0;
        if (inconsistent) {
            throw escrowMismatch(tx);
        }
        return entry;
    }

    private static LedgerEntry newPenalty(Transaction tx) {
        LedgerEntry entry = new LedgerEntry();
        entry.setId("l-" + shortId());
        entry.setUserId(tx.getLenderId());
        entry.setType(LedgerType.PENALTY);
        entry.setTxId(tx.getId());
        return entry;
    }

    private static BusinessException escrowMismatch(Transaction tx) {
        return new BusinessException("ESCROW_MISMATCH",
                "Transaction escrow is missing or inconsistent: " + tx.getId(),
                HttpStatus.CONFLICT.value());
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public record Assessment(double amount, LedgerEntry ledgerEntry) {}
}
