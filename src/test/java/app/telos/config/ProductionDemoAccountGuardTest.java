package app.telos.config;

import app.telos.domain.entity.User;
import app.telos.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionDemoAccountGuardTest {

    @Mock private UserRepository users;

    @Test
    void revokesPersistedDemoCredentialAndAdminGrant() {
        User demo = new User();
        demo.setId("u-001");
        demo.setPasswordHash("legacy-demo-hash");
        demo.setAdmin(true);
        when(users.findAllById(DemoAccounts.IDS)).thenReturn(List.of(demo));

        new ProductionDemoAccountGuard(users).run(null);

        assertThat(demo.getPasswordHash()).isNull();
        assertThat(demo.isAdmin()).isFalse();
        verify(users).save(demo);
    }
}
