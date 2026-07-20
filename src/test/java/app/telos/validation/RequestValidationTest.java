package app.telos.validation;

import app.telos.admin.dto.DecideVerificationRequest;
import app.telos.domain.enums.Mode;
import app.telos.handoff.dto.ScanRequest;
import app.telos.item.dto.CreateItemRequest;
import app.telos.transaction.dto.CreateTransactionRequest;
import app.telos.transaction.dto.PatchTransactionRequest;
import app.telos.wallet.dto.TopupRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsOutOfRangeTransactionDays() {
        assertThat(validator.validate(new CreateTransactionRequest("item-1", 0)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("days");
        assertThat(validator.validate(new CreateTransactionRequest("item-1", 366)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("days");
    }

    @Test
    void rejectsNonFiniteMoneyAndOversizedReceiptReference() {
        assertThat(validator.validate(
                new TopupRequest(Double.POSITIVE_INFINITY, "receipt"))).isNotEmpty();
        assertThat(validator.validate(
                new TopupRequest(10.0, "x".repeat(249)))).isNotEmpty();
        assertThat(validator.validate(new CreateItemRequest(
                "Item", "tools", Mode.RENT,
                Double.POSITIVE_INFINITY, 10.0, null))).isNotEmpty();
    }

    @Test
    void rejectsBlankLifecyclePayloads() {
        assertThat(validator.validate(new PatchTransactionRequest(" "))).isNotEmpty();
        assertThat(validator.validate(new ScanRequest(null))).isNotEmpty();
        assertThat(validator.validate(new DecideVerificationRequest(""))).isNotEmpty();
    }
}
