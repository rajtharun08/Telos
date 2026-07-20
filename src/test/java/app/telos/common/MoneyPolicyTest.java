package app.telos.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MoneyPolicyTest {

    @Test
    void rejectsNonFiniteExcessiveAndOverPrecisionAmounts() {
        assertThat(MoneyPolicy.isValid(Double.POSITIVE_INFINITY)).isFalse();
        assertThat(MoneyPolicy.isValid(Double.NaN)).isFalse();
        assertThat(MoneyPolicy.isValid(1_000_000.01)).isFalse();
        assertThat(MoneyPolicy.isValid(1.001)).isFalse();

        assertThatThrownBy(() -> MoneyPolicy.requirePositive(Double.POSITIVE_INFINITY, "amount"))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> MoneyPolicy.requireNonNegative(1.001, "price"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void performsCentExactArithmetic() {
        assertThat(MoneyPolicy.add(0.10, 0.20)).isEqualTo(0.30);
        assertThat(MoneyPolicy.subtract(10.00, 3.25)).isEqualTo(6.75);
        assertThat(MoneyPolicy.multiply(9.99, 3)).isEqualTo(29.97);
        assertThat(MoneyPolicy.same(29.970, 29.97)).isTrue();
    }
}
