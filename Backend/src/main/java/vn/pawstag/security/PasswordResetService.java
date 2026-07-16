package vn.pawstag.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.PasswordResetOtp;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PasswordResetOtpRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
public class PasswordResetService {

    public record IssueResult(String otp, int retryAfterSeconds) {
        public boolean issued() {
            return otp != null;
        }

        public static IssueResult issued(String otp) {
            return new IssueResult(otp, 0);
        }

        public static IssueResult cooldown(int retryAfterSeconds) {
            return new IssueResult(null, retryAfterSeconds);
        }
    }

    public enum OtpResult { OK, INVALID, TOO_MANY_ATTEMPTS }

    private final PasswordResetOtpRepository repository;
    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;
    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(
            PasswordResetOtpRepository repository,
            OwnerRepository ownerRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            @Value("${app.otp.resend-cooldown-seconds:60}") int resendCooldownSeconds) {
        this.repository = repository;
        this.ownerRepository = ownerRepository;
        this.passwordEncoder = passwordEncoder;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    @Transactional
    public IssueResult issue(String email) {
        String key = normalize(email);
        Instant now = Instant.now();

        PasswordResetOtp latest = repository.findTopByEmailOrderByCreatedAtDesc(key).orElse(null);
        // Kể cả mã đã dùng/bị khóa, vẫn giữ cooldown để không thể xin mã mới ngay
        // sau khi nhập sai quá số lần cho phép.
        if (latest != null && latest.getLastSentAt() != null
                && now.isBefore(latest.getLastSentAt().plusSeconds(resendCooldownSeconds))) {
            Instant allowedAt = latest.getLastSentAt().plusSeconds(resendCooldownSeconds);
            int retryAfter = Math.max(1, (int) Math.ceil(Duration.between(now, allowedAt).toMillis() / 1000.0));
            return IssueResult.cooldown(retryAfter);
        }

        repository.deleteByEmail(key);

        String otp = String.format("%06d", random.nextInt(1_000_000));
        PasswordResetOtp row = PasswordResetOtp.builder()
                .email(key)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(now.plus(expiryMinutes, ChronoUnit.MINUTES))
                .attemptCount(0)
                .createdAt(now)
                .lastSentAt(now)
                .build();
        repository.save(row);
        return IssueResult.issued(otp);
    }

    public int resendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    /**
     * Cân bằng chi phí xử lý giữa email tồn tại/không tồn tại hoặc request đang
     * trong cooldown. Không tạo OTP và không ghi database.
     */
    public void performDummyHash() {
        String dummy = String.format("%06d", random.nextInt(1_000_000));
        passwordEncoder.encode(dummy);
    }

    /**
     * Khóa dòng OTP rồi kiểm tra mã, cập nhật mật khẩu, tăng authVersion và đánh
     * dấu mã đã dùng trong cùng một transaction. Nếu bất kỳ bước nào thất bại,
     * toàn bộ thay đổi được rollback nên mã hợp lệ không bị mất oan.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OtpResult resetPassword(String email, String otp, String newPassword) {
        String key = normalize(email);
        PasswordResetOtp row = repository.findTopByEmailOrderByCreatedAtDesc(key).orElse(null);

        if (row == null || row.getUsedAt() != null) return OtpResult.INVALID;
        if (Instant.now().isAfter(row.getExpiresAt())) return OtpResult.INVALID;

        if (otp != null && passwordEncoder.matches(otp.trim(), row.getOtpHash())) {
            Owner owner = ownerRepository.findByEmail(key).orElse(null);
            if (owner == null) return OtpResult.INVALID;

            owner.setPasswordHash(passwordEncoder.encode(newPassword));
            owner.setAuthVersion(owner.getAuthVersion() + 1);
            row.setUsedAt(Instant.now());
            repository.save(row);
            ownerRepository.save(owner);
            return OtpResult.OK;
        }

        int attempts = row.getAttemptCount() + 1;
        if (attempts >= maxAttempts) {
            // Giữ dòng để cooldown vẫn còn hiệu lực, nhưng vô hiệu hóa mã hiện tại.
            row.setAttemptCount(attempts);
            row.setUsedAt(Instant.now());
            repository.save(row);
            return OtpResult.TOO_MANY_ATTEMPTS;
        }
        row.setAttemptCount(attempts);
        repository.save(row);
        return OtpResult.INVALID;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
