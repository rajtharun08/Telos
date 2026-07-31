package app.telos.domain.enums;

/** Wallet ledger entry status. Mirrors frontend ledger.status. */
public enum LedgerStatus {
    LOCKED,
    CLEARED,
    PENDING,
    REJECTED
}
