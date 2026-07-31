package app.telos.domain;

import app.telos.domain.enums.TxState;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StateMachineTest {

    @Test
    void allowsOnlyDeclaredLifecycleTransitions() {
        assertThat(StateMachine.canTransition(TxState.AVAILABLE, TxState.REQUESTED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.REQUESTED, TxState.APPROVED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.REQUESTED, TxState.DECLINED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.REQUESTED, TxState.CANCELLED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.APPROVED, TxState.ACTIVE)).isTrue();
        assertThat(StateMachine.canTransition(TxState.APPROVED, TxState.CANCELLED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.ACTIVE, TxState.RETURNED)).isTrue();
        assertThat(StateMachine.canTransition(TxState.ACTIVE, TxState.OVERDUE)).isTrue();
        assertThat(StateMachine.canTransition(TxState.OVERDUE, TxState.RETURNED)).isTrue();

        assertThat(StateMachine.canTransition(TxState.REQUESTED, TxState.RETURNED)).isFalse();
        assertThat(StateMachine.canTransition(TxState.RETURNED, TxState.ACTIVE)).isFalse();
    }

    @Test
    void identifiesOnlyClosedStatesAsTerminal() {
        assertThat(StateMachine.isTerminal(TxState.RETURNED)).isTrue();
        assertThat(StateMachine.isTerminal(TxState.DECLINED)).isTrue();
        assertThat(StateMachine.isTerminal(TxState.CANCELLED)).isTrue();
        assertThat(StateMachine.isTerminal(TxState.ACTIVE)).isFalse();
    }
}
