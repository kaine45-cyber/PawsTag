package vn.pawstag.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Throttle đăng nhập: sai quá ngưỡng → khóa email một khoảng thời gian.
 * Lưu trong bộ nhớ (reset khi restart) — đủ cho app 1 instance.
 */
@Service
public class LoginAttemptService {

    private final int maxAttempts;
    private final long lockMinutes;
    private final Map<String, Attempt> cache = new ConcurrentHashMap<>();

    public LoginAttemptService(
            @Value("${app.login.max-attempts:5}") int maxAttempts,
            @Value("${app.login.lock-minutes:5}") long lockMinutes) {
        this.maxAttempts = maxAttempts;
        this.lockMinutes = lockMinutes;
    }

    private record Attempt(int count, Instant lockedUntil) {}

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Số giây còn lại bị khóa (0 nếu không bị khóa). Tự reset khi hết hạn. */
    public long lockedSecondsRemaining(String email) {
        Attempt a = cache.get(key(email));
        if (a == null || a.lockedUntil() == null) return 0;
        if (Instant.now().isAfter(a.lockedUntil())) {
            cache.remove(key(email));   // hết hạn khóa → cho làm lại từ đầu
            return 0;
        }
        return Math.max(Duration.between(Instant.now(), a.lockedUntil()).getSeconds(), 1);
    }

    /** Ghi nhận 1 lần sai; đủ ngưỡng thì khóa. */
    public void loginFailed(String email) {
        String k = key(email);
        Attempt a = cache.get(k);
        int count = (a == null ? 0 : a.count()) + 1;
        Instant lockedUntil = count >= maxAttempts
                ? Instant.now().plus(lockMinutes, ChronoUnit.MINUTES)
                : null;
        cache.put(k, new Attempt(count, lockedUntil));
    }

    /** Đăng nhập thành công → xóa bộ đếm. */
    public void loginSucceeded(String email) {
        cache.remove(key(email));
    }
}
