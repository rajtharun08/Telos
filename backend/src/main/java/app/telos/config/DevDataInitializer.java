package app.telos.config;

import app.telos.domain.entity.User;
import app.telos.repo.UserRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Sets the local demo password on the explicit users created by V2__seed.sql.
 * The component exists only in the explicit dev profile.
 */
@Component
@Profile("dev & !prod")
public class DevDataInitializer {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DevDataInitializer(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedPasswords() {
        String hash = encoder.encode("demo1234");
        for (User user : users.findAll()) {
            if (!DemoAccounts.contains(user.getId())) {
                continue;
            }
            boolean changed = false;
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                user.setPasswordHash(hash);
                changed = true;
            }
            if (DemoAccounts.ADMIN_ID.equals(user.getId()) && !user.isAdmin()) {
                user.setAdmin(true);
                changed = true;
            }
            if (changed) {
                users.save(user);
            }
        }
    }
}
