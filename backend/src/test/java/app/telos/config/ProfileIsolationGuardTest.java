package app.telos.config;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileIsolationGuardTest {

    private static final String MIXED_PROFILE_ERROR =
            "The 'dev' and 'prod' profiles must not be active at the same time";

    @ParameterizedTest(name = "context initialization fails with active profiles {0}")
    @ValueSource(strings = {"dev,prod", "prod,dev"})
    void contextInitializationFailsWhenDevAndProdAreBothActive(String activeProfiles) {
        contextRunner(activeProfiles).run(context -> {
            Throwable startupFailure = context.getStartupFailure();

            assertThat(startupFailure)
                    .isNotNull()
                    .hasRootCauseInstanceOf(IllegalStateException.class)
                    .hasRootCauseMessage(MIXED_PROFILE_ERROR);
        });
    }

    @ParameterizedTest(name = "context initialization succeeds with active profile {0}")
    @ValueSource(strings = {"dev", "prod", "test"})
    void contextInitializationSucceedsWithIsolatedProfiles(String activeProfiles) {
        contextRunner(activeProfiles).run(context -> {
            assertThat(context.getStartupFailure()).isNull();
            assertThat(context).hasSingleBean(ProfileIsolationGuard.class);
        });
    }

    private static ApplicationContextRunner contextRunner(String activeProfiles) {
        return new ApplicationContextRunner()
                .withInitializer(context ->
                        context.getEnvironment().setActiveProfiles(activeProfiles.split(",")))
                .withUserConfiguration(ProfileIsolationGuard.class);
    }
}
