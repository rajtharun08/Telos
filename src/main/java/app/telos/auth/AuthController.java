package app.telos.auth;

import app.telos.auth.dto.AuthResponse;
import app.telos.auth.dto.LoginRequest;
import app.telos.auth.dto.SignupRequest;
import app.telos.auth.dto.UserProfileDto;
import app.telos.security.CurrentUser;
import app.telos.security.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Locale;

/** Auth endpoints: login, signup, logout, and current-user profile. */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;
    private final RateLimitService rateLimits;

    public AuthController(AuthService authService,
                          CurrentUser currentUser,
                          RateLimitService rateLimits) {
        this.authService = authService;
        this.currentUser = currentUser;
        this.rateLimits = rateLimits;
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req,
                              HttpServletRequest request) {
        rateLimits.check("auth-login-ip", request.getRemoteAddr(),
                20, Duration.ofMinutes(1));
        rateLimits.check("auth-login-account",
                req.email().trim().toLowerCase(Locale.ROOT),
                5, Duration.ofMinutes(5));
        return authService.login(req);
    }

    @PostMapping("/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest req,
                               HttpServletRequest request) {
        rateLimits.check("auth-signup-ip", request.getRemoteAddr(),
                10, Duration.ofHours(1));
        rateLimits.check("auth-signup-account",
                req.email().trim().toLowerCase(Locale.ROOT),
                3, Duration.ofHours(1));
        return authService.signup(req);
    }

    /** Stateless JWT: logout is a client-side token discard. Always 204. */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserProfileDto me() {
        return authService.profile(currentUser.id());
    }
}
