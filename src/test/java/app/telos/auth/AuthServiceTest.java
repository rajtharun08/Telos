package app.telos.auth;

import app.telos.auth.dto.LoginRequest;
import app.telos.common.BusinessException;
import app.telos.domain.entity.User;
import app.telos.repo.UserRepository;
import app.telos.repo.WalletRepository;
import app.telos.security.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository users;
    @Mock private WalletRepository wallets;
    @Mock private PasswordEncoder encoder;
    @Mock private TokenService tokens;

    private MockEnvironment environment;
    private AuthService service;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        service = new AuthService(users, wallets, encoder, tokens, environment);
    }

    @Test
    void rejectsDemoLoginOutsideDevProfileEvenWhenHashStillExists() {
        environment.setActiveProfiles("prod");
        User demo = demoUser();
        when(users.findByEmail("aliya.rahman@telos.app")).thenReturn(Optional.of(demo));

        BusinessException error = catchThrowableOfType(
                () -> service.login(new LoginRequest("aliya.rahman@telos.app", "demo1234")),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_CREDENTIALS");
        verifyNoInteractions(encoder, tokens);
    }

    @ParameterizedTest(name = "rejects demo login with active profiles {0}")
    @ValueSource(strings = {"dev,prod", "prod,dev"})
    void rejectsDemoLoginWhenDevAndProdProfilesAreBothActive(String activeProfiles) {
        environment.setActiveProfiles(activeProfiles.split(","));
        User demo = demoUser();
        when(users.findByEmail("aliya.rahman@telos.app")).thenReturn(Optional.of(demo));

        BusinessException error = catchThrowableOfType(
                () -> service.login(new LoginRequest("aliya.rahman@telos.app", "demo1234")),
                BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_CREDENTIALS");
        verifyNoInteractions(encoder, tokens);
    }

    @Test
    void allowsDemoLoginOnlyInDevProfile() {
        environment.setActiveProfiles("dev");
        User demo = demoUser();
        when(users.findByEmail("aliya.rahman@telos.app")).thenReturn(Optional.of(demo));
        when(encoder.matches("demo1234", "demo-hash")).thenReturn(true);
        when(tokens.issue("u-001", "aliya.rahman@telos.app", true)).thenReturn("jwt");

        var response = service.login(new LoginRequest("aliya.rahman@telos.app", "demo1234"));

        assertThat(response.token()).isEqualTo("jwt");
    }

    private static User demoUser() {
        User user = new User();
        user.setId("u-001");
        user.setName("Aliya");
        user.setEmail("aliya.rahman@telos.app");
        user.setPasswordHash("demo-hash");
        user.setAdmin(true);
        return user;
    }
}
