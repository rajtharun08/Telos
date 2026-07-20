package app.telos.config;

import app.telos.domain.entity.User;
import app.telos.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevDataInitializerTest {

    @Mock
    private UserRepository users;
    @Mock
    private PasswordEncoder encoder;

    @Test
    void hashesOnlyKnownDemoUsers() {
        User demo = user("u-001", null);
        User realAccount = user("u-real", null);
        User existing = user("u-101", "existing-hash");
        when(users.findAll()).thenReturn(List.of(demo, realAccount, existing));
        when(encoder.encode("demo1234")).thenReturn("demo-hash");

        new DevDataInitializer(users, encoder).seedPasswords();

        assertThat(demo.getPasswordHash()).isEqualTo("demo-hash");
        assertThat(demo.isAdmin()).isTrue();
        assertThat(realAccount.getPasswordHash()).isNull();
        assertThat(existing.getPasswordHash()).isEqualTo("existing-hash");
        verify(users).save(demo);
        verify(users, never()).save(realAccount);
        verify(users, never()).save(existing);
    }

    @Test
    void componentIsActiveInDevProfile() {
        contextRunner("dev").run(context ->
                assertThat(context).hasSingleBean(DevDataInitializer.class));
    }

    @ParameterizedTest(name = "initializer is inactive with active profiles {0}")
    @ValueSource(strings = {"prod", "test", "dev,prod", "prod,dev"})
    void componentIsInactiveOutsideIsolatedDevProfile(String activeProfiles) {
        contextRunner(activeProfiles).run(context ->
                assertThat(context).doesNotHaveBean(DevDataInitializer.class));
    }

    private ApplicationContextRunner contextRunner(String activeProfiles) {
        return new ApplicationContextRunner()
                .withInitializer(context ->
                        context.getEnvironment().setActiveProfiles(activeProfiles.split(",")))
                .withBean(UserRepository.class, () -> users)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(DevDataInitializer.class);
    }

    private static User user(String id, String passwordHash) {
        User user = new User();
        user.setId(id);
        user.setPasswordHash(passwordHash);
        return user;
    }
}
