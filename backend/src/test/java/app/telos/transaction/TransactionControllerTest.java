package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.domain.enums.TxState;
import app.telos.security.CurrentUser;
import app.telos.transaction.dto.PatchTransactionRequest;
import app.telos.transaction.dto.PatchTransactionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService service;
    @Mock
    private CurrentUser currentUser;

    private TransactionController controller;

    @BeforeEach
    void setUp() {
        controller = new TransactionController(service, currentUser);
    }

    @Test
    void rejectsUnknownTargetStateWithTypedBadRequest() {
        BusinessException error = catchThrowableOfType(
                () -> controller.patch("tx-1", new PatchTransactionRequest("unknown")),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_STATE");
        assertThat(error.getStatus()).isEqualTo(400);
        verifyNoInteractions(service, currentUser);
    }

    @Test
    void acceptsCaseInsensitiveTargetState() {
        when(currentUser.id()).thenReturn("lender");
        PatchTransactionResponse expected =
                new PatchTransactionResponse("tx-1", TxState.APPROVED, true);
        when(service.transition("lender", "tx-1", TxState.APPROVED)).thenReturn(expected);

        PatchTransactionResponse actual =
                controller.patch("tx-1", new PatchTransactionRequest("approved"));

        assertThat(actual).isEqualTo(expected);
        verify(service).transition("lender", "tx-1", TxState.APPROVED);
    }
}
