package app.telos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Development token issuer/verifier using HS256. Active unless a Firebase
 * service-account is configured (see SecurityConfig). Mirrors the contract's
 * { token, user } shape — the token carries userId, email, and an admin flag.
 *
 * Swap-in path for production: implement TokenService with the Firebase Admin
 * SDK (verifyIdToken) and mark it @Primary; this class stays as the dev fallback.
 */
@Service
public class DevJwtTokenService implements TokenService {

    private final SecretKey key;
    private final long ttlSeconds;

    public DevJwtTokenService(
            @Value("${telos.jwt.secret}") String secret,
            @Value("${telos.jwt.ttl-seconds:86400}") long ttlSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlSeconds = ttlSeconds;
    }

    @Override
    public String issue(String userId, String email, boolean admin) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("admin", admin)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttlSeconds, ChronoUnit.SECONDS)))
                .signWith(key)
                .compact();
    }

    @Override
    public Principal verify(String token) {
        Claims c = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return new Principal(c.getSubject(),
                c.get("email", String.class),
                Boolean.TRUE.equals(c.get("admin", Boolean.class)));
    }
}
