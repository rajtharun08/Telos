package app.telos.domain.enums;

/** Transaction lifecycle states. Mirrors frontend src/lib/stateMachine.js STATES. */
public enum TxState {
    AVAILABLE,
    REQUESTED,
    APPROVED,
    ACTIVE,
    RETURNED,
    DECLINED,
    CANCELLED,
    OVERDUE
}
