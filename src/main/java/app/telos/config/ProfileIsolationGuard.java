package app.telos.config;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** Fails application startup when development and production profiles overlap. */
@Component
public class ProfileIsolationGuard {

    public ProfileIsolationGuard(Environment environment) {
        if (environment.acceptsProfiles(Profiles.of("dev & prod"))) {
            throw new IllegalStateException(
                    "The 'dev' and 'prod' profiles must not be active at the same time");
        }
    }
}
