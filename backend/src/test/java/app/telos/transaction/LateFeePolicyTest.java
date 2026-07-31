package app.telos.transaction;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class LateFeePolicyTest {

    private static final Instant DUE_AT = Instant.parse("2026-07-01T10:00:00Z");

    @Test
    void chargesNothingUntilTheDueInstantHasPassed() {
        assertThat(LateFeePolicy.calculate(null, DUE_AT, 5.0, 25.0)).isZero();
        assertThat(LateFeePolicy.calculate(DUE_AT, DUE_AT.minusNanos(1), 5.0, 25.0)).isZero();
        assertThat(LateFeePolicy.calculate(DUE_AT, DUE_AT, 5.0, 25.0)).isZero();
    }

    @Test
    void chargesByStartedWholeSecondDayUsingTheExistingCeilingSemantics() {
        assertThat(LateFeePolicy.calculate(DUE_AT, DUE_AT.plusNanos(1), 5.0, 25.0))
                .isEqualTo(5.0);
        assertThat(LateFeePolicy.calculate(DUE_AT, DUE_AT.plus(1, ChronoUnit.DAYS), 5.0, 25.0))
                .isEqualTo(5.0);
        assertThat(LateFeePolicy.calculate(
                DUE_AT, DUE_AT.plus(1, ChronoUnit.DAYS).plusSeconds(1), 5.0, 25.0))
                .isEqualTo(10.0);
    }

    @Test
    void capsAssessmentAtBoth365DaysAndTheDeposit() {
        Instant fourHundredDaysLate = DUE_AT.plus(400, ChronoUnit.DAYS);

        assertThat(LateFeePolicy.calculate(DUE_AT, fourHundredDaysLate, 5.0, 5_000.0))
                .isEqualTo(1_825.0);
        assertThat(LateFeePolicy.calculate(DUE_AT, fourHundredDaysLate, 5.0, 12.0))
                .isEqualTo(12.0);
    }
}
