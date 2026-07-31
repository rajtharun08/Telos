package app.telos.config;

import app.telos.domain.entity.User;
import app.telos.repo.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Defense in depth for databases previously booted with local demo settings. */
@Component
@Profile("prod")
public class ProductionDemoAccountGuard implements ApplicationRunner {

    private final UserRepository users;

    public ProductionDemoAccountGuard(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (User user : users.findAllById(DemoAccounts.IDS)) {
            if ((user.getPasswordHash() != null && !user.getPasswordHash().isBlank())
                    || user.isAdmin()) {
                user.setPasswordHash(null);
                user.setAdmin(false);
                users.save(user);
            }
        }
    }
}
