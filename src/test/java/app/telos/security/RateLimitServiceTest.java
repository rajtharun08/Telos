package app.telos.security;

import app.telos.common.RateLimitException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimitServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-19T10:00:00Z");

    @Test
    void permitsRequestsWithinSharedLimitAndHashesDiscriminator() {
        RateLimitStore store = mock(RateLimitStore.class);
        Duration window = Duration.ofMinutes(1);
        when(store.consume(anyString(), org.mockito.ArgumentMatchers.eq(NOW),
                org.mockito.ArgumentMatchers.eq(NOW.plus(window))))
                .thenReturn(new RateLimitStore.Result(3, NOW.plus(window)));
        RateLimitService service = new RateLimitService(
                store, Clock.fixed(NOW, ZoneOffset.UTC));

        service.check("login-account", "person@example.test", 5, window);

        var key = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(store).consume(key.capture(), org.mockito.ArgumentMatchers.eq(NOW),
                org.mockito.ArgumentMatchers.eq(NOW.plus(window)));
        assertThat(key.getValue()).hasSize(64).doesNotContain("person@example.test");
    }

    @Test
    void rejectsRequestsOverLimitWithRetryAfter() {
        RateLimitStore store = mock(RateLimitStore.class);
        Duration window = Duration.ofMinutes(5);
        when(store.consume(anyString(), org.mockito.ArgumentMatchers.eq(NOW),
                org.mockito.ArgumentMatchers.eq(NOW.plus(window))))
                .thenReturn(new RateLimitStore.Result(6, NOW.plusSeconds(91)));
        RateLimitService service = new RateLimitService(
                store, Clock.fixed(NOW, ZoneOffset.UTC));

        RateLimitException error = catchThrowableOfType(
                () -> service.check("login-account", "person@example.test", 5, window),
                RateLimitException.class);

        assertThat(error.getRetryAfterSeconds()).isEqualTo(91);
    }
}
