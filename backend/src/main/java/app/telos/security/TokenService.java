package app.telos.security;

/**
 * Abstraction over token verification so the dev HS256 issuer and a future
 * Firebase verifier present the same seam to the security filter.
 */
public interface TokenService {

    /** Authenticated principal extracted from a verified token. */
    record Principal(String userId, String email, boolean admin) {}

    /** Issue a signed token for a user (dev issuer). Firebase impl may no-op. */
    String issue(String userId, String email, boolean admin);

    /** Verify a token and return its principal, or throw if invalid/expired. */
    Principal verify(String token);
}
