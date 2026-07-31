package app.telos.auth;

import app.telos.auth.dto.AuthResponse;
import app.telos.auth.dto.LoginRequest;
import app.telos.auth.dto.SignupRequest;
import app.telos.auth.dto.UserProfileDto;
import app.telos.common.BusinessException;
import app.telos.common.NotFoundException;
import app.telos.config.DemoAccounts;
import app.telos.domain.entity.User;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.KycStatus;
import app.telos.repo.UserRepository;
import app.telos.repo.WalletRepository;
import app.telos.security.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/** Authentication and registration use-cases. */
@Service
public class AuthService {

    private final UserRepository users;
    private final WalletRepository wallets;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    private final Environment environment;

    public AuthService(UserRepository users,
                       WalletRepository wallets,
                       PasswordEncoder encoder,
                       TokenService tokens,
                       Environment environment) {
        this.users = users;
        this.wallets = wallets;
        this.encoder = encoder;
        this.tokens = tokens;
        this.environment = environment;
    }

    /** Verify credentials and issue a token. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email())
                .orElseThrow(() -> invalidCredentials());

        if (DemoAccounts.contains(user.getId())
                && !environment.acceptsProfiles(Profiles.of("dev & !prod"))) {
            throw invalidCredentials();
        }

        String hash = user.getPasswordHash();
        if (hash == null || hash.isBlank() || !encoder.matches(req.password(), hash)) {
            throw invalidCredentials();
        }

        String token = tokens.issue(user.getId(), user.getEmail(), user.isAdmin());
        return new AuthResponse(token, UserProfileDto.from(user));
    }

    /** Register a new resident, create their wallet, and issue a token. */
    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new BusinessException(
                    "EMAIL_TAKEN", "An account with that email already exists", HttpStatus.CONFLICT.value());
        }

        User user = new User();
        user.setId("u-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setNeighborhood(req.neighborhood());
        user.setJoined(LocalDate.now());
        user.setRating(0);
        user.setReviews(0);
        user.setVerified(false);
        user.setKycStatus(KycStatus.PENDING);
        user.setAdmin(false);
        users.save(user);

        Wallet wallet = new Wallet();
        wallet.setUserId(user.getId());
        wallet.setAvailable(0);
        wallet.setLocked(0);
        wallet.setEarned(0);
        wallet.setPendingClear(0);
        wallets.save(wallet);

        String token = tokens.issue(user.getId(), user.getEmail(), user.isAdmin());
        return new AuthResponse(token, UserProfileDto.from(user));
    }

    /** Load the full profile of the given user id. */
    @Transactional(readOnly = true)
    public UserProfileDto profile(String userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        return UserProfileDto.from(user);
    }

    private static BusinessException invalidCredentials() {
        return new BusinessException(
                "INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED.value());
    }
}
