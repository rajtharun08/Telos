package app.telos.transaction;

import app.telos.common.NotFoundException;
import app.telos.domain.StateMachine;
import app.telos.domain.entity.Item;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.TxState;
import app.telos.repo.ItemRepository;
import app.telos.repo.TransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

/** Moves due active rentals to OVERDUE and records a pending lender penalty. */
@Service
public class OverdueService {

    private final TransactionRepository transactions;
    private final ItemRepository items;
    private final LateFeeAssessmentService lateFees;
    private final Clock clock;

    public OverdueService(TransactionRepository transactions,
                          ItemRepository items,
                          LateFeeAssessmentService lateFees,
                          Clock clock) {
        this.transactions = transactions;
        this.items = items;
        this.lateFees = lateFees;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${telos.overdue.sweep-ms:60000}")
    @Transactional
    public void markOverdueTransactions() {
        Instant now = clock.instant();
        for (Transaction candidate : transactions.findByStateAndDueAtBefore(TxState.ACTIVE, now)) {
            Transaction tx = transactions.findByIdForUpdate(candidate.getId()).orElse(null);
            if (tx == null || tx.getState() != TxState.ACTIVE
                    || tx.getDueAt() == null || !tx.getDueAt().isBefore(now)) {
                continue;
            }
            if (!StateMachine.canTransition(TxState.ACTIVE, TxState.OVERDUE)) {
                throw new IllegalStateException("State machine no longer permits overdue transition");
            }

            Item item = items.findByIdForUpdate(tx.getItemId())
                    .orElseThrow(() -> new NotFoundException("Item not found: " + tx.getItemId()));
            lateFees.assess(tx, now);

            tx.setState(TxState.OVERDUE);
            item.setState(TxState.OVERDUE);
            transactions.save(tx);
            items.save(item);
        }
    }
}
