package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.domain.entity.Item;
import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import app.telos.repo.ItemRepository;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-19T10:00:00Z");

    @Mock
    private TransactionRepository transactions;
    @Mock
    private ItemRepository items;
    @Mock
    private WalletRepository wallets;
    @Mock
    private LedgerEntryRepository ledger;

    private TransactionService service;

    @BeforeEach
    void setUp() {
        service = new TransactionService(
                transactions, items, wallets, ledger,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void transitionRequiresHandoffForPickup() {
        Transaction tx = transaction(TxState.APPROVED);
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        BusinessException error = catchThrowableOfType(
                () -> service.transition("borrower", "tx-1", TxState.ACTIVE),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("HANDOFF_REQUIRED");
        assertThat(error.getStatus()).isEqualTo(409);
        assertThat(tx.getState()).isEqualTo(TxState.APPROVED);
        verify(transactions, never()).save(any());
    }

    @Test
    void createRejectsRequestingOwnListing() {
        Item item = item("owner");
        when(items.findByIdForUpdate("item-1")).thenReturn(Optional.of(item));

        BusinessException error = catchThrowableOfType(
                () -> service.create("owner", "item-1", 2),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("SELF_REQUEST");
        assertThat(error.getStatus()).isEqualTo(409);
        verifyNoInteractions(wallets, ledger);
        verify(transactions, never()).save(any());
    }

    @Test
    void createRejectsItemWithAnotherOpenTransaction() {
        Item item = item("lender");
        when(items.findByIdForUpdate("item-1")).thenReturn(Optional.of(item));
        when(transactions.existsByItemIdAndStateIn(any(), any())).thenReturn(true);

        BusinessException error = catchThrowableOfType(
                () -> service.create("borrower", "item-1", 2),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("ITEM_UNAVAILABLE");
        assertThat(error.getStatus()).isEqualTo(409);
        verifyNoInteractions(wallets, ledger);
        verify(transactions, never()).save(any());
    }

    @Test
    void declineClearsTheOriginalEscrowHold() {
        Transaction tx = transaction(TxState.REQUESTED);
        tx.setFee(10.0);
        tx.setDeposit(25.0);
        tx.setItemTitle("Test item");
        when(transactions.findByIdForUpdate("tx-1")).thenReturn(Optional.of(tx));

        app.telos.domain.entity.Wallet wallet = new app.telos.domain.entity.Wallet();
        wallet.setUserId("borrower");
        wallet.setAvailable(100.0);
        wallet.setLocked(35.0);
        when(wallets.findByIdForUpdate("borrower")).thenReturn(Optional.of(wallet));

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
        Item item = item("lender");
        item.setState(TxState.REQUESTED);
        when(items.findByIdForUpdate("item-1")).thenReturn(Optional.of(item));

        service.transition("lender", "tx-1", TxState.DECLINED);

        assertThat(tx.getState()).isEqualTo(TxState.DECLINED);
        assertThat(item.getState()).isEqualTo(TxState.AVAILABLE);
        assertThat(wallet.getLocked()).isZero();
        assertThat(wallet.getAvailable()).isEqualTo(135.0);
        assertThat(escrow.getStatus()).isEqualTo(app.telos.domain.enums.LedgerStatus.CLEARED);
        verify(ledger, org.mockito.Mockito.times(2)).save(any());
    }

    @ParameterizedTest
    @EnumSource(Mode.class)
    void requestCreationDoesNotStartFulfillmentClock(Mode mode) {
        Item item = item("lender");
        item.setMode(mode);
        when(items.findByIdForUpdate("item-1")).thenReturn(Optional.of(item));

        app.telos.domain.entity.Wallet wallet = new app.telos.domain.entity.Wallet();
        wallet.setUserId("borrower");
        wallet.setAvailable(100.0);
        when(wallets.findByIdForUpdate("borrower")).thenReturn(Optional.of(wallet));

        var response = service.create("borrower", "item-1", 2);

        assertThat(response.createdAt()).isEqualTo(NOW);
        assertThat(response.dueAt()).isNull();
        assertThat(response.days()).isEqualTo(2);
        assertThat(item.getState()).isEqualTo(TxState.REQUESTED);
    }

    private static Item item(String ownerId) {
        Item item = new Item();
        item.setId("item-1");
        item.setOwnerId(ownerId);
        item.setMode(Mode.RENT);
        item.setState(TxState.AVAILABLE);
        item.setPrice(10.0);
        item.setDeposit(25.0);
        item.setTitle("Test item");
        return item;
    }

    private static Transaction transaction(TxState state) {
        Transaction tx = new Transaction();
        tx.setId("tx-1");
        tx.setItemId("item-1");
        tx.setBorrowerId("borrower");
        tx.setLenderId("lender");
        tx.setState(state);
        return tx;
    }
}
