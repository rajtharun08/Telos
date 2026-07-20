package app.telos.domain;

import app.telos.domain.enums.TxState;

import java.util.List;
import java.util.Map;

import static app.telos.domain.enums.TxState.*;

/**
 * Server-authoritative transaction state machine. Mirrors the frontend
 * src/lib/stateMachine.js TRANSITIONS map exactly. The backend is the source
 * of truth; illegal transitions are rejected with 409 ILLEGAL_TRANSITION.
 *
 * AVAILABLE -> REQUESTED -> APPROVED -> ACTIVE -> RETURNED
 * with terminal branches DECLINED / CANCELLED, and OVERDUE -> RETURNED.
 */
public final class StateMachine {

    private StateMachine() {}

    /** Allowed transitions. Keys are current state, values are reachable states. */
    public static final Map<TxState, List<TxState>> TRANSITIONS = Map.of(
            AVAILABLE, List.of(REQUESTED),
            REQUESTED, List.of(APPROVED, DECLINED, CANCELLED),
            APPROVED,  List.of(ACTIVE, CANCELLED),
            ACTIVE,    List.of(RETURNED, OVERDUE),
            OVERDUE,   List.of(RETURNED),
            RETURNED,  List.of(),
            DECLINED,  List.of(),
            CANCELLED, List.of()
    );

    /** The happy-path lifecycle used by the stepper UI. */
    public static final List<TxState> LIFECYCLE =
            List.of(AVAILABLE, REQUESTED, APPROVED, ACTIVE, RETURNED);

    public static boolean canTransition(TxState from, TxState to) {
        return TRANSITIONS.getOrDefault(from, List.of()).contains(to);
    }

    public static List<TxState> nextStates(TxState from) {
        return TRANSITIONS.getOrDefault(from, List.of());
    }

    public static boolean isTerminal(TxState state) {
        return TRANSITIONS.getOrDefault(state, List.of()).isEmpty();
    }
}
