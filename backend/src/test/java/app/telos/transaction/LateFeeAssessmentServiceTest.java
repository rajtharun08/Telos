package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.repo.LedgerEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LateFeeAssessmentServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-19T10:00:00Z");

    @Mock
    private LedgerEntryRepository ledger;

    private LateFeeAssessmentService service;

    @BeforeEach
    void setUp() {
        service = new LateFeeAssessmentService(ledger, 5.0);
    }

    @Test
    void createsTheSinglePendingPenaltyRowOnFirstLateAssessment() {
        Transaction tx = transaction(NOW.minusSeconds(1));
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY))
                .thenReturn(Optional.empty());

        LateFeeAssessmentService.Assessment assessment = service.assess(tx, NOW);

        assertThat(assessment.amount()).isEqualTo(5.0);
        assertThat(assessment.ledgerEntry()).isNotNull();
        assertThat(tx.getLateFee()).isEqualTo(5.0);
        LedgerEntry entry = assessment.ledgerEntry();
        assertThat(entry.getTxId()).isEqualTo("tx-1");
        assertThat(entry.getUserId()).isEqualTo("lender");
        assertThat(entry.getType()).isEqualTo(LedgerType.PENALTY);
        assertThat(entry.getStatus()).isEqualTo(LedgerStatus.PENDING);
        assertThat(entry.getAmount()).isEqualTo(5.0);
        assertThat(entry.getAt()).isEqualTo(NOW);
        verify(ledger).save(entry);
    }

    @Test
    void updatesTheExistingPendingPenaltyInsteadOfCreatingAnotherRow() {
        Transaction tx = transaction(NOW.minus(2, ChronoUnit.DAYS).minusSeconds(1));
        tx.setLateFee(5.0);
        LedgerEntry existing = penalty(5.0, LedgerStatus.PENDING);
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY))
                .thenReturn(Optional.of(existing));

        LateFeeAssessmentService.Assessment assessment = service.assess(tx, NOW);

        assertThat(assessment.amount()).isEqualTo(15.0);
        assertThat(assessment.ledgerEntry()).isSameAs(existing);
        assertThat(tx.getLateFee()).isEqualTo(15.0);
        assertThat(existing.getAmount()).isEqualTo(15.0);
        assertThat(existing.getAt()).isEqualTo(NOW);
        verify(ledger).save(existing);
    }

    @Test
    void leavesLateFeeNullAndDoesNotTouchLedgerWhenNotLate() {
        Transaction tx = transaction(NOW.plusSeconds(1));

        LateFeeAssessmentService.Assessment assessment = service.assess(tx, NOW);

        assertThat(assessment.amount()).isZero();
        assertThat(assessment.ledgerEntry()).isNull();
        assertThat(tx.getLateFee()).isNull();
        verifyNoInteractions(ledger);
    }

    @Test
    void rejectsAPreviouslySettledPenaltyRow() {
        Transaction tx = transaction(NOW.minusSeconds(1));
        LedgerEntry settled = penalty(5.0, LedgerStatus.CLEARED);
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY))
                .thenReturn(Optional.of(settled));

        BusinessException error = catchThrowableOfType(
                () -> service.assess(tx, NOW), BusinessException.class);

        assertThat(error.getCode()).isEqualTo("ESCROW_MISMATCH");
        assertThat(tx.getLateFee()).isNull();
        verify(ledger, never()).save(any());
    }

    private static Transaction transaction(Instant dueAt) {
        Transaction tx = new Transaction();
        tx.setId("tx-1");
        tx.setItemTitle("Test item");
        tx.setLenderId("lender");
        tx.setDeposit(25.0);
        tx.setDueAt(dueAt);
        return tx;
    }

    private static LedgerEntry penalty(double amount, LedgerStatus status) {
        LedgerEntry entry = new LedgerEntry();
        entry.setId("penalty-1");
        entry.setTxId("tx-1");
        entry.setUserId("lender");
        entry.setType(LedgerType.PENALTY);
        entry.setLabel("Late fee — Test item");
        entry.setAmount(amount);
        entry.setAt(NOW.minusSeconds(30));
        entry.setStatus(status);
        return entry;
    }
}
