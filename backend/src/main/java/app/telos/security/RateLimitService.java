package app.telos.security;

import app.telos.common.RateLimitException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class RateLimitService {

    private final RateLimitStore store;
    private final Clock clock;

    public RateLimitService(RateLimitStore store) {
        this(store, Clock.systemUTC());
    }

    RateLimitService(RateLimitStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public void check(String scope, String discriminator, int limit, Duration window) {
        if (scope == null || scope.isBlank() || discriminator == null || discriminator.isBlank()
                || limit < 1 || window == null || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("Invalid rate-limit policy");
        }

        Instant now = clock.instant();
        Instant newExpiry = now.plus(window);
        RateLimitStore.Result result = store.consume(
                hash(scope + ':' + discriminator), now, newExpiry);
        if (result.requestCount() > limit) {
            long retryAfter = Math.max(
                    1L, Duration.between(now, result.expiresAt()).getSeconds());
            throw new RateLimitException(retryAfter);
        }
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
