package app.telos.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;

@Repository
public class PostgresRateLimitStore implements RateLimitStore {

    private static final String CONSUME_SQL = """
            INSERT INTO rate_limit_bucket
                (bucket_key, window_started_at, request_count, expires_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT (bucket_key) DO UPDATE SET
                request_count = CASE
                    WHEN rate_limit_bucket.expires_at <= EXCLUDED.window_started_at THEN 1
                    ELSE rate_limit_bucket.request_count + 1
                END,
                window_started_at = CASE
                    WHEN rate_limit_bucket.expires_at <= EXCLUDED.window_started_at
                    THEN EXCLUDED.window_started_at
                    ELSE rate_limit_bucket.window_started_at
                END,
                expires_at = CASE
                    WHEN rate_limit_bucket.expires_at <= EXCLUDED.window_started_at
                    THEN EXCLUDED.expires_at
                    ELSE rate_limit_bucket.expires_at
                END
            RETURNING request_count, expires_at
            """;

    private final JdbcTemplate jdbc;

    public PostgresRateLimitStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Result consume(String bucketKey, Instant now, Instant newExpiry) {
        Result result = jdbc.queryForObject(
                CONSUME_SQL,
                (rs, rowNum) -> new Result(
                        rs.getInt("request_count"),
                        rs.getTimestamp("expires_at").toInstant()),
                bucketKey,
                Timestamp.from(now),
                Timestamp.from(newExpiry));
        if (result == null) {
            throw new IllegalStateException("Rate-limit upsert returned no row");
        }

        // Bounded opportunistic cleanup; the expiry index keeps this inexpensive.
        jdbc.update("DELETE FROM rate_limit_bucket WHERE expires_at < ?",
                Timestamp.from(now.minusSeconds(3600)));
        return result;
    }
}
