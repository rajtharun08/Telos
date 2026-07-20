package app.telos.common;

import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Boundary and arithmetic rules for monetary values while legacy entities use doubles. */
public final class MoneyPolicy {

    public static final double MAX_AMOUNT = 1_000_000.00;
    private static final int SCALE = 2;

    private MoneyPolicy() {}

    public static double requirePositive(double value, String field) {
        if (!isValid(value) || value <= 0) {
            throw invalid(field);
        }
        return value;
    }

    public static double requireNonNegative(double value, String field) {
        if (!isValid(value) || value < 0) {
            throw invalid(field);
        }
        return value;
    }

    public static boolean isValid(double value) {
        if (!Double.isFinite(value) || value > MAX_AMOUNT) {
            return false;
        }
        BigDecimal normalized = BigDecimal.valueOf(value).stripTrailingZeros();
        return normalized.scale() <= SCALE;
    }

    public static boolean same(double left, double right) {
        return cents(left).compareTo(cents(right)) == 0;
    }

    public static double add(double left, double right) {
        return cents(left).add(cents(right)).setScale(SCALE, RoundingMode.UNNECESSARY).doubleValue();
    }

    public static double subtract(double left, double right) {
        return cents(left).subtract(cents(right)).setScale(SCALE, RoundingMode.UNNECESSARY).doubleValue();
    }

    public static double multiply(double amount, int multiplier) {
        return cents(amount).multiply(BigDecimal.valueOf(multiplier))
                .setScale(SCALE, RoundingMode.UNNECESSARY)
                .doubleValue();
    }

    private static BigDecimal cents(double value) {
        if (!Double.isFinite(value)) {
            throw invalid("amount");
        }
        try {
            return BigDecimal.valueOf(value).setScale(SCALE, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException ex) {
            throw invalid("amount");
        }
    }

    private static BusinessException invalid(String field) {
        return new BusinessException("INVALID_AMOUNT",
                field + " must be finite, at most 1,000,000.00, and use no more than two decimals",
                HttpStatus.BAD_REQUEST.value());
    }
}
