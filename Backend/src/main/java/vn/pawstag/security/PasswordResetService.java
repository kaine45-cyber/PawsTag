package vn.pawstag.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quên mật khẩu: sinh + kiểm tra mã OTP 6 số.
 * Lưu trong bộ nhớ (reset khi restart) — cùng cách với LoginAttemptService, đủ cho app 1 instance.
 * OTP lưu dạng hash (không lưu plaintext), hết hạn sau otp.expiry-minutes, sai quá otp.max-attempts thì huỷ.
 */
@Service
public class PasswordResetService {

    private final int expiryMinutes;
    private final int maxAttempts;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    public PasswordResetService(
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            PasswordEncoder passwordEncoder) {
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.passwordEncoder = passwordEncoder;
    }

    private record Entry(String otpHash, Instant expiresAt, int attempts) {}

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Sinh OTP 6 số mới cho email, lưu hash lại, trả về mã plaintext để gửi email. */
    public String generate(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES);
        cache.put(key(email), new Entry(passwordEncoder.encode(otp), expiresAt, 0));
        return otp;
    }

    /**
     * Kiểm tra OTP người dùng nhập. true = đúng (và xoá luôn để không dùng lại được);
     * false = sai/hết hạn/không tồn tại. Sai quá {@code maxAttempts} lần thì huỷ mã, phải gửi lại.
     */
    public boolean verify(String email, String otp) {
        String k = key(email);
        Entry e = cache.get(k);
        if (e == null) return false;
        if (Instant.now().isAfter(e.expiresAt())) {
            cache.remove(k);
            return false;
        }
        if (otp != null && passwordEncoder.matches(otp, e.otpHash())) {
            cache.remove(k);   // dùng 1 lần
            return true;
        }
        int attempts = e.attempts() + 1;
        if (attempts >= maxAttempts) {
            cache.remove(k);   // sai quá nhiều lần → huỷ, bắt gửi lại mã mới
        } else {
            cache.put(k, new Entry(e.otpHash(), e.expiresAt(), attempts));
        }
        return false;
    }
}
