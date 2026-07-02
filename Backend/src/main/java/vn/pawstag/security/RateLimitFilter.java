package vn.pawstag.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate-limit theo IP cho các endpoint công khai (chống spam scan / brute-force).
 * Cửa sổ cố định 1 phút, in-memory. Vượt ngưỡng → HTTP 429.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final int limitPerMinute;
    private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();
    private volatile long currentWindow = windowOf(Instant.now());

    public RateLimitFilter(@Value("${app.ratelimit.per-minute:60}") int limitPerMinute) {
        this.limitPerMinute = limitPerMinute;
    }

    private static long windowOf(Instant t) {
        return t.getEpochSecond() / 60;
    }

    private boolean shouldLimit(HttpServletRequest req) {
        String path = req.getServletPath();
        return path.startsWith("/public/")
                || path.startsWith("/auth/")
                || (path.equals("/scans") && "POST".equalsIgnoreCase(req.getMethod()));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!shouldLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        long window = windowOf(Instant.now());
        if (window != currentWindow) {     // sang phút mới → reset bộ đếm
            counters.clear();
            currentWindow = window;
        }

        String ip = clientIp(request);
        int count = counters.computeIfAbsent(ip, k -> new AtomicInteger()).incrementAndGet();

        if (count > limitPerMinute) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"data\":null,\"message\":\"Too many requests. Please slow down.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
