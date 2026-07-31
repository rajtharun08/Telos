package app.telos.domain.enums;

/** Wallet ledger entry type. Mirrors frontend ledger.type. */
public enum LedgerType {
    ESCROW_LOCK,
    DEPOSIT_RELEASE,
    PAYOUT,
    TOPUP,
    PENALTY
}
