package app.telos.transaction;

import app.telos.common.MoneyPolicy;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

/** Pure late-fee calculation shared by overdue sweeps and return settlement. */
public final class LateFeePolicy {

    private static final long SECONDS_PER_DAY = 86_400L;
    private static final int MAX_OVERDUE_DAYS = 365;

    private LateFeePolicy() {}

    public static double calculate(Instant dueAt,
                                   Instant assessedAt,
                                   double dailyPenalty,
                                   double deposit) {
        Objects.requireNonNull(assessedAt, "assessment instant");
        double validDailyPenalty = MoneyPolicy.requirePositive(dailyPenalty, "daily penalty");
        double validDeposit = MoneyPolicy.requireNonNegative(deposit, "deposit");
        if (dueAt == null || !dueAt.isBefore(assessedAt)) {
            return 0.0;
        }

        long overdueSeconds = Math.max(1L, Duration.between(dueAt, assessedAt).getSeconds());
        long startedDays = 1L + ((overdueSeconds - 1L) / SECONDS_PER_DAY);
        int overdueDays = Math.toIntExact(Math.min(MAX_OVERDUE_DAYS, startedDays));
        double assessed = MoneyPolicy.multiply(validDailyPenalty, overdueDays);
        return Math.min(validDeposit, assessed);
    }
}
