package app.telos.admin;

import app.telos.common.BusinessException;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.UserRepository;
import app.telos.repo.VerificationRepository;
import app.telos.repo.WalletRepository;
import app.telos.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private VerificationRepository verifications;
    @Mock
    private LedgerEntryRepository ledger;
    @Mock
    private WalletRepository wallets;
    @Mock
    private TransactionRepository transactions;
    @Mock
    private UserRepository users;
    @Mock
    private CurrentUser currentUser;

    private AdminService service;

    @BeforeEach
    void setUp() {
        service = new AdminService(
                verifications, ledger, wallets, transactions, users, currentUser);
    }

    @Test
    void rejectsUnknownStatusFilterWithTypedBadRequest() {
        when(currentUser.isAdmin()).thenReturn(true);
        when(currentUser.id()).thenReturn("admin");
        app.telos.domain.entity.User admin = new app.telos.domain.entity.User();
        admin.setId("admin");
        admin.setAdmin(true);
        when(users.findById("admin")).thenReturn(java.util.Optional.of(admin));

        BusinessException error = catchThrowableOfType(
                () -> service.list("unknown"), BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_STATUS");
        assertThat(error.getStatus()).isEqualTo(400);
        verifyNoInteractions(verifications, ledger, wallets, transactions);
    }
}
