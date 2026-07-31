package app.telos.security;

import java.time.Instant;

public interface RateLimitStore {

    Result consume(String bucketKey, Instant now, Instant newExpiry);

    record Result(int requestCount, Instant expiresAt) {}
}
