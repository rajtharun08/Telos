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

    private void assertRejects(Object object) {
        try {
            assertThat(validator.validate(object)).isNotEmpty();
        } catch (jakarta.validation.ValidationException e) {
            assertThat(e.getCause()).isInstanceOf(NumberFormatException.class);
        }
    }

    @Test
    void rejectsNonFiniteMoneyAndOversizedReceiptReference() {
        assertRejects(new TopupRequest(Double.POSITIVE_INFINITY, "receipt"));
        assertRejects(new TopupRequest(10.0, "x".repeat(249)));
        assertRejects(new CreateItemRequest("Item", "tools", Mode.RENT,
                Double.POSITIVE_INFINITY, 10.0, null));
    }

    @Test
    void rejectsBlankLifecyclePayloads() {
        assertThat(validator.validate(new PatchTransactionRequest(" "))).isNotEmpty();
        assertThat(validator.validate(new ScanRequest(null))).isNotEmpty();
        assertThat(validator.validate(new DecideVerificationRequest(""))).isNotEmpty();
    }
}
