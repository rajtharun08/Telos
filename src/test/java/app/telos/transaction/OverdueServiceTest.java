package app.telos.transaction;

import app.telos.domain.entity.Item;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.TxState;
import app.telos.repo.ItemRepository;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OverdueServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-19T10:00:00Z");

    @Mock private TransactionRepository transactions;
    @Mock private ItemRepository items;
    @Mock private LedgerEntryRepository ledger;

    @Test
    void marksDueRentalOverdueAndCreatesPendingPenalty() {
        Transaction tx = new Transaction();
        tx.setId("tx-1");
        tx.setItemId("item-1");
        tx.setItemTitle("Test item");
        tx.setBorrowerId("borrower");
        tx.setLenderId("lender");
        tx.setState(TxState.ACTIVE);
        tx.setDeposit(25.0);
        tx.setDueAt(NOW.minusSeconds(2 * 24 * 60 * 60));
        Item item = new Item();
        item.setId("item-1");
        item.setState(TxState.ACTIVE);
        when(transactions.findByStateAndDueAtBefore(TxState.ACTIVE, NOW))
                .thenReturn(List.of(tx));
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        when(items.findByIdForUpdate("item-1")).thenReturn(Optional.of(item));
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY))
                .thenReturn(Optional.empty());

        LateFeeAssessmentService lateFees = new LateFeeAssessmentService(ledger, 5.0);
        OverdueService service = new OverdueService(
                transactions, items, lateFees,
                Clock.fixed(NOW, ZoneOffset.UTC));
        service.markOverdueTransactions();

        assertThat(tx.getState()).isEqualTo(TxState.OVERDUE);
        assertThat(tx.getLateFee()).isEqualTo(10.0);
        assertThat(item.getState()).isEqualTo(TxState.OVERDUE);
        ArgumentCaptor<LedgerEntry> entry = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledger).save(entry.capture());
        assertThat(entry.getValue().getType()).isEqualTo(LedgerType.PENALTY);
        assertThat(entry.getValue().getStatus()).isEqualTo(LedgerStatus.PENDING);
        assertThat(entry.getValue().getUserId()).isEqualTo("lender");
        assertThat(entry.getValue().getAmount()).isEqualTo(10.0);
    }
}
