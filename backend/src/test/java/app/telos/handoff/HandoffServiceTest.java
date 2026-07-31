package app.telos.handoff;

import app.telos.common.BusinessException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import app.telos.handoff.dto.MintTokenResponse;
import app.telos.handoff.dto.ScanResponse;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.WalletRepository;
import app.telos.transaction.LateFeeAssessmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HandoffServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-19T10:00:00Z");

    @Mock
    private TransactionRepository transactions;
    @Mock
    private WalletRepository wallets;
    @Mock
    private LedgerEntryRepository ledger;
    @Mock
    private app.telos.repo.HandoffTokenRepository handoffTokens;
    @Mock
    private app.telos.repo.ItemRepository items;

    private HandoffService service;
    private app.telos.domain.entity.HandoffToken persistedToken;
    private app.telos.domain.entity.Item item;

    @BeforeEach
    void setUp() {
        service = new HandoffService(
                transactions, wallets, ledger, handoffTokens, items,
                new LateFeeAssessmentService(ledger, 5.0),
                Clock.fixed(NOW, ZoneOffset.UTC));
        item = new app.telos.domain.entity.Item();
        item.setId("item-1");
        item.setMode(app.telos.domain.enums.Mode.RENT);
        item.setState(TxState.APPROVED);
        org.mockito.Mockito.lenient()
                .when(items.findByIdForUpdate("item-1"))
                .thenReturn(Optional.of(item));
        org.mockito.Mockito.lenient().when(handoffTokens.save(any())).thenAnswer(invocation -> {
            persistedToken = invocation.getArgument(0);
            return persistedToken;
        });
        org.mockito.Mockito.lenient()
                .when(handoffTokens.findById(any()))
                .thenAnswer(invocation -> Optional.ofNullable(persistedToken));
        org.mockito.Mockito.lenient()
                .when(handoffTokens.findByTokenHashForUpdate(any()))
                .thenAnswer(invocation -> Optional.ofNullable(persistedToken));
    }

    @Test
    void mintRejectsTransactionThatIsNotReadyForHandoff() {
        Transaction tx = transaction(TxState.REQUESTED);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        BusinessException error = catchThrowableOfType(
                () -> service.mint("borrower", "tx-1"),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("HANDOFF_NOT_READY");
        assertThat(error.getStatus()).isEqualTo(409);
    }

    @Test
    void tokenIssuerCannotScanOwnToken() {
        Transaction tx = transaction(TxState.APPROVED);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        BusinessException error = catchThrowableOfType(
                () -> service.scan("borrower", minted.token()),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("HANDOFF_SELF_SCAN");
        assertThat(error.getStatus()).isEqualTo(403);
        assertThat(tx.getState()).isEqualTo(TxState.APPROVED);
        verify(transactions, never()).save(any());
    }

    @Test
    void pickupTokenCannotBeReinterpretedAsReturnToken() {
        Transaction tx = transaction(TxState.APPROVED);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");

        tx.setState(TxState.ACTIVE);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        BusinessException error = catchThrowableOfType(
                () -> service.scan("lender", minted.token()),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("HANDOFF_TOKEN_STALE");
        assertThat(error.getStatus()).isEqualTo(409);
        assertThat(tx.getState()).isEqualTo(TxState.ACTIVE);
        verify(transactions, never()).save(any());
        verifyNoInteractions(wallets, ledger);
    }

    @ParameterizedTest
    @EnumSource(Mode.class)
    void pickupUsesTheScanInstantAsTheRentalClockOrigin(Mode mode) {
        Transaction tx = transaction(TxState.APPROVED);
        tx.setMode(mode);
        tx.setDays(3);
        tx.setDueAt(NOW.minus(10, ChronoUnit.DAYS));
        item.setMode(mode);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        ScanResponse response = service.scan("lender", minted.token());

        assertThat(response.state()).isEqualTo(TxState.ACTIVE);
        assertThat(tx.getState()).isEqualTo(TxState.ACTIVE);
        if (mode == Mode.BUY) {
            assertThat(tx.getDueAt()).isNull();
        } else {
            assertThat(tx.getDueAt()).isEqualTo(NOW.plus(3, ChronoUnit.DAYS));
        }
        assertThat(persistedToken.getConsumedAt()).isEqualTo(NOW);
        assertThat(item.getState()).isEqualTo(TxState.ACTIVE);
        verify(transactions, org.mockito.Mockito.times(2)).findByIdForUpdate("tx-1");
        verify(transactions).save(tx);
        verifyNoInteractions(wallets, ledger);
    }

    @Test
    void returnTokenSettlesEscrowExactlyOnceAndRejectsReplay() {
        Transaction tx = transaction(TxState.ACTIVE);
        tx.setItemTitle("Test item");
        tx.setDueAt(NOW.plusSeconds(1));
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        app.telos.domain.entity.Wallet borrower = new app.telos.domain.entity.Wallet();
        borrower.setUserId("borrower");
        borrower.setAvailable(100.0);
        borrower.setLocked(35.0);
        app.telos.domain.entity.Wallet lender = new app.telos.domain.entity.Wallet();
        lender.setUserId("lender");
        lender.setAvailable(50.0);
        lender.setEarned(0.0);
        when(wallets.findAllByUserIdInForUpdate(any()))
                .thenReturn(java.util.List.of(borrower, lender));
        app.telos.domain.entity.LedgerEntry escrow = new app.telos.domain.entity.LedgerEntry();
        escrow.setId("escrow-1");
        escrow.setTxId("tx-1");
        escrow.setUserId("borrower");
        escrow.setType(app.telos.domain.enums.LedgerType.ESCROW_LOCK);
        escrow.setAmount(-35.0);
        escrow.setStatus(app.telos.domain.enums.LedgerStatus.LOCKED);
        when(ledger.findByTxIdAndTypeForUpdate(
                "tx-1", app.telos.domain.enums.LedgerType.ESCROW_LOCK))
                .thenReturn(Optional.of(escrow));

        ScanResponse response = service.scan("lender", minted.token());
        BusinessException replay = catchThrowableOfType(
                () -> service.scan("lender", minted.token()),
                BusinessException.class);

        assertThat(response.state()).isEqualTo(TxState.RETURNED);
        assertThat(response.returnedAt()).isEqualTo(NOW);
        assertThat(tx.getLateFee()).isNull();
        assertThat(item.getState()).isEqualTo(TxState.AVAILABLE);
        assertThat(borrower.getLocked()).isZero();
        assertThat(borrower.getAvailable()).isEqualTo(125.0);
        assertThat(lender.getEarned()).isEqualTo(10.0);
        assertThat(lender.getAvailable()).isEqualTo(60.0);
        assertThat(escrow.getStatus()).isEqualTo(app.telos.domain.enums.LedgerStatus.CLEARED);
        assertThat(persistedToken.getConsumedAt()).isNotNull();
        assertThat(replay.getCode()).isEqualTo("TOKEN_EXPIRED");
        verify(wallets, org.mockito.Mockito.times(2)).save(any());
        verify(ledger, org.mockito.Mockito.times(3)).save(any());
        verify(ledger, never()).findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY);
        verify(transactions).save(tx);
    }

    @Test
    void activeReturnAfterDueAssessesAndSettlesPenaltyBeforeSchedulerRuns() {
        Transaction tx = transaction(TxState.ACTIVE);
        tx.setItemTitle("Test item");
        tx.setDueAt(NOW.minusSeconds(1));
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");

        app.telos.domain.entity.Wallet borrower = new app.telos.domain.entity.Wallet();
        borrower.setUserId("borrower");
        borrower.setAvailable(100.0);
        borrower.setLocked(35.0);
        app.telos.domain.entity.Wallet lender = new app.telos.domain.entity.Wallet();
        lender.setUserId("lender");
        lender.setAvailable(50.0);
        lender.setEarned(0.0);
        when(wallets.findAllByUserIdInForUpdate(any()))
                .thenReturn(List.of(borrower, lender));

        LedgerEntry escrow = new LedgerEntry();
        escrow.setId("escrow-1");
        escrow.setTxId("tx-1");
        escrow.setUserId("borrower");
        escrow.setType(LedgerType.ESCROW_LOCK);
        escrow.setAmount(-35.0);
        escrow.setStatus(LedgerStatus.LOCKED);
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.ESCROW_LOCK))
                .thenReturn(Optional.of(escrow));
        when(ledger.findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY))
                .thenReturn(Optional.empty());
        List<String> penaltyWrites = new ArrayList<>();
        doAnswer(invocation -> {
            LedgerEntry entry = invocation.getArgument(0);
            if (entry.getType() == LedgerType.PENALTY) {
                penaltyWrites.add(entry.getAmount() + ":" + entry.getStatus());
            }
            return entry;
        }).when(ledger).save(any());
        clearInvocations(transactions, items, wallets, ledger);

        ScanResponse response = service.scan("lender", minted.token());

        assertThat(response.state()).isEqualTo(TxState.RETURNED);
        assertThat(response.returnedAt()).isEqualTo(NOW);
        assertThat(tx.getLateFee()).isEqualTo(5.0);
        assertThat(borrower.getLocked()).isZero();
        assertThat(borrower.getAvailable()).isEqualTo(120.0);
        assertThat(lender.getAvailable()).isEqualTo(65.0);
        assertThat(lender.getEarned()).isEqualTo(15.0);
        assertThat(escrow.getStatus()).isEqualTo(LedgerStatus.CLEARED);
        assertThat(penaltyWrites).containsExactly(
                "5.0:PENDING", "5.0:CLEARED");
        verify(ledger, org.mockito.Mockito.times(5)).save(any());

        InOrder lockOrder = inOrder(transactions, items, wallets, ledger);
        lockOrder.verify(transactions).findByIdForUpdate("tx-1");
        lockOrder.verify(items).findByIdForUpdate("item-1");
        lockOrder.verify(wallets).findAllByUserIdInForUpdate(any());
        lockOrder.verify(ledger).findByTxIdAndTypeForUpdate("tx-1", LedgerType.ESCROW_LOCK);
        lockOrder.verify(ledger).findByTxIdAndTypeForUpdate("tx-1", LedgerType.PENALTY);
    }

    @Test
    void overdueReturnUpdatesPendingFeeBeforeSettlement() {
        Transaction tx = transaction(TxState.OVERDUE);
        tx.setItemTitle("Test item");
        tx.setDueAt(NOW.minus(2, ChronoUnit.DAYS).minusSeconds(1));
        tx.setLateFee(5.0);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));
        MintTokenResponse minted = service.mint("borrower", "tx-1");
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        app.telos.domain.entity.Wallet borrower = new app.telos.domain.entity.Wallet();
        borrower.setUserId("borrower");
        borrower.setAvailable(100.0);
        borrower.setLocked(35.0);
        app.telos.domain.entity.Wallet lender = new app.telos.domain.entity.Wallet();
        lender.setUserId("lender");
        lender.setAvailable(50.0);
        lender.setEarned(0.0);
        when(wallets.findAllByUserIdInForUpdate(any()))
                .thenReturn(java.util.List.of(borrower, lender));

        app.telos.domain.entity.LedgerEntry escrow = new app.telos.domain.entity.LedgerEntry();
        escrow.setId("escrow-1");
        escrow.setTxId("tx-1");
        escrow.setUserId("borrower");
        escrow.setType(app.telos.domain.enums.LedgerType.ESCROW_LOCK);
        escrow.setAmount(-35.0);
        escrow.setStatus(app.telos.domain.enums.LedgerStatus.LOCKED);
        app.telos.domain.entity.LedgerEntry penalty = new app.telos.domain.entity.LedgerEntry();
        penalty.setId("penalty-1");
        penalty.setTxId("tx-1");
        penalty.setUserId("lender");
        penalty.setType(app.telos.domain.enums.LedgerType.PENALTY);
        penalty.setAmount(5.0);
        penalty.setStatus(app.telos.domain.enums.LedgerStatus.PENDING);
        when(ledger.findByTxIdAndTypeForUpdate(
                "tx-1", app.telos.domain.enums.LedgerType.ESCROW_LOCK))
                .thenReturn(Optional.of(escrow));
        when(ledger.findByTxIdAndTypeForUpdate(
                "tx-1", app.telos.domain.enums.LedgerType.PENALTY))
                .thenReturn(Optional.of(penalty));
        List<String> penaltyWrites = new ArrayList<>();
        doAnswer(invocation -> {
            LedgerEntry entry = invocation.getArgument(0);
            if (entry.getType() == LedgerType.PENALTY) {
                penaltyWrites.add(entry.getAmount() + ":" + entry.getStatus());
            }
            return entry;
        }).when(ledger).save(any());

        ScanResponse response = service.scan("lender", minted.token());

        assertThat(response.state()).isEqualTo(TxState.RETURNED);
        assertThat(response.returnedAt()).isEqualTo(NOW);
        assertThat(tx.getLateFee()).isEqualTo(15.0);
        assertThat(item.getState()).isEqualTo(TxState.AVAILABLE);
        assertThat(borrower.getLocked()).isZero();
        assertThat(borrower.getAvailable()).isEqualTo(110.0);
        assertThat(lender.getAvailable()).isEqualTo(75.0);
        assertThat(lender.getEarned()).isEqualTo(25.0);
        assertThat(escrow.getStatus()).isEqualTo(app.telos.domain.enums.LedgerStatus.CLEARED);
        assertThat(penalty.getAmount()).isEqualTo(15.0);
        assertThat(penalty.getStatus()).isEqualTo(app.telos.domain.enums.LedgerStatus.CLEARED);
        assertThat(penaltyWrites).containsExactly(
                "15.0:PENDING", "15.0:CLEARED");

        org.mockito.ArgumentCaptor<app.telos.domain.entity.LedgerEntry> entries =
                org.mockito.ArgumentCaptor.forClass(app.telos.domain.entity.LedgerEntry.class);
        verify(ledger, org.mockito.Mockito.times(5)).save(entries.capture());
        assertThat(entries.getAllValues()).anySatisfy(entry -> {
            assertThat(entry.getType()).isEqualTo(app.telos.domain.enums.LedgerType.DEPOSIT_RELEASE);
            assertThat(entry.getAmount()).isEqualTo(10.0);
        });
        assertThat(entries.getAllValues()).anySatisfy(entry -> {
            assertThat(entry.getType()).isEqualTo(app.telos.domain.enums.LedgerType.PAYOUT);
            assertThat(entry.getAmount()).isEqualTo(10.0);
        });
    }

    private static Transaction transaction(TxState state) {
        Transaction tx = new Transaction();
        tx.setId("tx-1");
        tx.setItemId("item-1");
        tx.setMode(app.telos.domain.enums.Mode.RENT);
        tx.setBorrowerId("borrower");
        tx.setLenderId("lender");
        tx.setState(state);
        tx.setFee(10.0);
        tx.setDeposit(25.0);
        return tx;
    }
}
