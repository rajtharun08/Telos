package app.telos.config;

import app.telos.security.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

@Component
public class ApiRateLimitInterceptor implements HandlerInterceptor {

    private static final int REQUESTS_PER_MINUTE = 300;
    private final RateLimitService rateLimits;

    public ApiRateLimitInterceptor(RateLimitService rateLimits) {
        this.rateLimits = rateLimits;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String discriminator = authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())
                ? "user:" + authentication.getPrincipal()
                : "ip:" + request.getRemoteAddr();
        rateLimits.check("api-global", discriminator,
                REQUESTS_PER_MINUTE, Duration.ofMinutes(1));
        return true;
    }
}
