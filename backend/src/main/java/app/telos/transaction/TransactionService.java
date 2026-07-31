package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.common.IllegalTransitionException;
import app.telos.common.MoneyPolicy;
import app.telos.common.NotFoundException;
import app.telos.domain.StateMachine;
import app.telos.domain.entity.Item;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Transaction;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.Mode;
import app.telos.domain.enums.Role;
import app.telos.domain.enums.TxState;
import app.telos.repo.ItemRepository;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.WalletRepository;
import app.telos.transaction.dto.CreateTransactionResponse;
import app.telos.transaction.dto.PatchTransactionResponse;
import app.telos.transaction.dto.TransactionDto;
import app.telos.transaction.dto.TransactionListResponse;
import app.telos.transaction.dto.WalletEcho;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Transaction lifecycle + escrow core.
 *
 * Escrow model: on request, fee+deposit is moved from the borrower wallet's
 * available -> locked balance and a signed-negative ESCROW_LOCK ledger entry is
 * written. On DECLINE/CANCEL the held amount is released back (locked ->
 * available) with a DEPOSIT_RELEASE entry. Final settlement (deposit release to
 * borrower + fee payout to lender) happens on RETURNED via the handoff scan.
 */
@Service
public class TransactionService {

    private static final Set<TxState> OPEN_STATES =
            Set.of(TxState.REQUESTED, TxState.APPROVED, TxState.ACTIVE, TxState.OVERDUE);
    private static final Set<TxState> CLOSED_STATES =
            Set.of(TxState.RETURNED, TxState.DECLINED, TxState.CANCELLED);

    private final TransactionRepository transactions;
    private final ItemRepository items;
    private final WalletRepository wallets;
    private final LedgerEntryRepository ledger;
    private final Clock clock;

    public TransactionService(TransactionRepository transactions,
                              ItemRepository items,
                              WalletRepository wallets,
                              LedgerEntryRepository ledger,
                              Clock clock) {
        this.transactions = transactions;
        this.items = items;
        this.wallets = wallets;
        this.ledger = ledger;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TransactionListResponse list(String uid, String roleFilter, String statusFilter) {
        List<Transaction> rows = transactions.findByBorrowerIdOrLenderId(uid, uid);
        List<TransactionDto> out = new ArrayList<>();
        for (Transaction tx : rows) {
            Role viewerRole = tx.getBorrowerId().equals(uid) ? Role.BORROWER : Role.LENDER;
            if (!roleMatches(viewerRole, roleFilter)) continue;
            if (!statusMatches(tx.getState(), statusFilter)) continue;
            out.add(toDto(tx, uid, viewerRole));
        }
        return new TransactionListResponse(out);
    }

    @Transactional
    public CreateTransactionResponse create(String uid, String itemId, int days) {
        // Lock the listing while checking availability so two requests cannot both
        // pass on different application instances.
        Item item = items.findByIdForUpdate(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found: " + itemId));

        if (item.getOwnerId().equals(uid)) {
            throw new BusinessException("SELF_REQUEST",
                    "You cannot request your own listing", HttpStatus.CONFLICT.value());
        }
        if (item.getState() != TxState.AVAILABLE
                || transactions.existsByItemIdAndStateIn(itemId, OPEN_STATES)) {
            throw new BusinessException("ITEM_UNAVAILABLE",
                    "Item is not available for request", HttpStatus.CONFLICT.value());
        }
        if (days < 1 || days > 365) {
            throw new BusinessException("INVALID_DAYS",
                    "Days must be between 1 and 365", HttpStatus.BAD_REQUEST.value());
        }

        int reqDays = days;
        Mode mode = item.getMode();
        double price = MoneyPolicy.requireNonNegative(item.getPrice(), "price");
        double fee = switch (mode) {
            case BUY -> price;
            case RENT -> MoneyPolicy.multiply(price, reqDays);
            case BORROW -> 0.0;
        };
        double deposit = MoneyPolicy.requireNonNegative(item.getDeposit(), "deposit");
        double hold = MoneyPolicy.requireNonNegative(
                MoneyPolicy.add(fee, deposit), "fee and deposit total");

        Wallet borrowerWallet = wallets.findByIdForUpdate(uid)
                .orElseThrow(() -> new NotFoundException("Wallet not found: " + uid));
        if (borrowerWallet.getAvailable() < hold) {
            throw new BusinessException("INSUFFICIENT_FUNDS",
                    "Insufficient available funds to cover fee and deposit",
                    HttpStatus.CONFLICT.value());
        }

        Instant now = clock.instant();
        String txId = "tx-" + shortId();

        Transaction tx = new Transaction();
        tx.setId(txId);
        tx.setItemId(item.getId());
        tx.setItemTitle(item.getTitle());
        tx.setBorrowerId(uid);
        tx.setLenderId(item.getOwnerId());
        tx.setMode(mode);
        tx.setState(TxState.REQUESTED);
        tx.setFee(fee);
        tx.setDeposit(deposit);
        tx.setDays(reqDays);
        tx.setLateFee(null);
        tx.setCreatedAt(now);
        tx.setDueAt(null);
        tx.setReturnedAt(null);
        tx.setCoordsUnlocked(false);
        item.setState(TxState.REQUESTED);

        // ESCROW: atomically lock fee+deposit from the borrower's wallet.
        borrowerWallet.setAvailable(MoneyPolicy.subtract(borrowerWallet.getAvailable(), hold));
        borrowerWallet.setLocked(MoneyPolicy.add(borrowerWallet.getLocked(), hold));

        LedgerEntry lock = new LedgerEntry();
        lock.setId("l-" + shortId());
        lock.setUserId(uid);
        lock.setType(LedgerType.ESCROW_LOCK);
        lock.setLabel("Escrow lock — " + item.getTitle());
        lock.setAmount(-hold);
        lock.setAt(now);
        lock.setStatus(LedgerStatus.LOCKED);
        lock.setTxId(txId);

        items.save(item);
        transactions.save(tx);
        wallets.save(borrowerWallet);
        ledger.save(lock);

        TransactionDto dto = toDto(tx, uid, Role.BORROWER);
        WalletEcho echo = new WalletEcho(borrowerWallet.getAvailable(), borrowerWallet.getLocked());
        return new CreateTransactionResponse(
                dto.id(), dto.itemId(), dto.itemTitle(), dto.role(), dto.counterpartyId(),
                dto.mode(), dto.state(), dto.fee(), dto.deposit(), dto.days(), dto.lateFee(),
                dto.createdAt(), dto.dueAt(), dto.returnedAt(), dto.coordsUnlocked(), echo);
    }

    @Transactional
    public PatchTransactionResponse transition(String uid, String txId, TxState toState) {
        // Serialize competing approve/decline/cancel decisions. Without this lock,
        // a decline could release escrow while a concurrent approval wins the state.
        Transaction tx = transactions.findByIdForUpdate(txId)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + txId));

        boolean isBorrower = tx.getBorrowerId().equals(uid);
        boolean isLender = tx.getLenderId().equals(uid);
        if (!isBorrower && !isLender) {
            throw new NotFoundException("Transaction not found: " + txId);
        }

        TxState from = tx.getState();
        if (!StateMachine.canTransition(from, toState)) {
            throw new IllegalTransitionException(from.name(), toState.name());
        }

        // PATCH is only for request decisions. Pickup and return must pass
        // through HandoffService so physical confirmation and settlement run.
        if (toState != TxState.APPROVED
                && toState != TxState.DECLINED
                && toState != TxState.CANCELLED) {
            throw new BusinessException("HANDOFF_REQUIRED",
                    "Pickup and return transitions require the handoff workflow",
                    HttpStatus.CONFLICT.value());
        }

        switch (toState) {
            case APPROVED, DECLINED -> requireLender(isLender, toState);
            case CANCELLED -> requireBorrower(isBorrower);
            default -> throw new IllegalStateException("Unexpected PATCH transition: " + toState);
        }

        Item item = items.findByIdForUpdate(tx.getItemId())
                .orElseThrow(() -> new NotFoundException("Item not found: " + tx.getItemId()));
        tx.setState(toState);
        item.setState(toState == TxState.APPROVED ? TxState.APPROVED : TxState.AVAILABLE);
        items.save(item);
        if (toState == TxState.APPROVED) {
            tx.setCoordsUnlocked(true);
        } else if (toState == TxState.CANCELLED || toState == TxState.DECLINED) {
            tx.setCoordsUnlocked(false);
        }
        if (toState == TxState.DECLINED || toState == TxState.CANCELLED) {
            releaseEscrow(tx);
        }
        transactions.save(tx);

        return new PatchTransactionResponse(tx.getId(), tx.getState(), tx.isCoordsUnlocked());
    }

    /** Releases the locked fee+deposit hold back to the borrower's available balance. */
    private void releaseEscrow(Transaction tx) {
        double fee = MoneyPolicy.requireNonNegative(tx.getFee(), "fee");
        double deposit = MoneyPolicy.requireNonNegative(tx.getDeposit(), "deposit");
        double hold = MoneyPolicy.add(fee, deposit);
        Wallet borrowerWallet = wallets.findByIdForUpdate(tx.getBorrowerId())
                .orElseThrow(() -> new NotFoundException("Wallet not found: " + tx.getBorrowerId()));
        LedgerEntry escrow = ledger.findByTxIdAndTypeForUpdate(
                        tx.getId(), LedgerType.ESCROW_LOCK)
                .orElseThrow(() -> escrowMismatch(tx));

        boolean invalidEscrow = escrow.getStatus() != LedgerStatus.LOCKED
                || !tx.getBorrowerId().equals(escrow.getUserId())
                || !Double.isFinite(escrow.getAmount())
                || !MoneyPolicy.same(-escrow.getAmount(), hold)
                || !Double.isFinite(borrowerWallet.getLocked())
                || borrowerWallet.getLocked() < hold;
        if (invalidEscrow) {
            throw escrowMismatch(tx);
        }

        escrow.setStatus(LedgerStatus.CLEARED);
        ledger.save(escrow);
        borrowerWallet.setLocked(MoneyPolicy.subtract(borrowerWallet.getLocked(), hold));
        borrowerWallet.setAvailable(MoneyPolicy.add(borrowerWallet.getAvailable(), hold));
        wallets.save(borrowerWallet);

        LedgerEntry release = new LedgerEntry();
        release.setId("l-" + shortId());
        release.setUserId(tx.getBorrowerId());
        release.setType(LedgerType.DEPOSIT_RELEASE);
        release.setLabel("Escrow released — " + tx.getItemTitle());
        release.setAmount(hold);
        release.setAt(clock.instant());
        release.setStatus(LedgerStatus.CLEARED);
        release.setTxId(tx.getId());
        ledger.save(release);
    }

    private static BusinessException escrowMismatch(Transaction tx) {
        return new BusinessException("ESCROW_MISMATCH",
                "Transaction escrow is missing or inconsistent: " + tx.getId(),
                HttpStatus.CONFLICT.value());
    }

    private void requireLender(boolean isLender, TxState toState) {
        if (!isLender) {
            throw new BusinessException("FORBIDDEN",
                    "Only the lender can " + toState.name().toLowerCase() + " this request",
                    HttpStatus.FORBIDDEN.value());
        }
    }

    private void requireBorrower(boolean isBorrower) {
        if (!isBorrower) {
            throw new BusinessException("FORBIDDEN",
                    "Only the borrower can cancel this request",
                    HttpStatus.FORBIDDEN.value());
        }
    }

    private TransactionDto toDto(Transaction tx, String uid, Role viewerRole) {
        String counterpartyId = viewerRole == Role.BORROWER ? tx.getLenderId() : tx.getBorrowerId();
        return new TransactionDto(
                tx.getId(), tx.getItemId(), tx.getItemTitle(), viewerRole, counterpartyId,
                tx.getMode(), tx.getState(), tx.getFee(), tx.getDeposit(), tx.getDays(),
                tx.getLateFee(), tx.getCreatedAt(), tx.getDueAt(), tx.getReturnedAt(),
                tx.isCoordsUnlocked());
    }

    private boolean roleMatches(Role viewerRole, String filter) {
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("ALL")) return true;
        return viewerRole.name().equalsIgnoreCase(filter);
    }

    private boolean statusMatches(TxState state, String filter) {
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("ALL")) return true;
        if (filter.equalsIgnoreCase("OPEN")) return OPEN_STATES.contains(state);
        if (filter.equalsIgnoreCase("CLOSED")) return CLOSED_STATES.contains(state);
        // Allow filtering by an explicit state name too.
        return state.name().equalsIgnoreCase(filter);
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
