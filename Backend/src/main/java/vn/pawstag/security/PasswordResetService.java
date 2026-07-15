package vn.pawstag.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.entity.PasswordResetOtp;
import vn.pawstag.repository.PasswordResetOtpRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

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
    private final PasswordEncoder passwordEncoder;
    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(
            PasswordResetOtpRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            @Value("${app.otp.resend-cooldown-seconds:60}") int resendCooldownSeconds) {
        this.repository = repository;
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
        if (latest != null && latest.getUsedAt() == null && latest.getLastSentAt() != null
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OtpResult verify(String email, String otp) {
        String key = normalize(email);
        PasswordResetOtp row = repository.findTopByEmailOrderByCreatedAtDesc(key).orElse(null);

        if (row == null || row.getUsedAt() != null) return OtpResult.INVALID;
        if (Instant.now().isAfter(row.getExpiresAt())) return OtpResult.INVALID;

        if (otp != null && passwordEncoder.matches(otp.trim(), row.getOtpHash())) {
            row.setUsedAt(Instant.now());
            repository.save(row);
            return OtpResult.OK;
        }

        int attempts = row.getAttemptCount() + 1;
        if (attempts >= maxAttempts) {
            repository.delete(row);
            return OtpResult.TOO_MANY_ATTEMPTS;
        }
        row.setAttemptCount(attempts);
        repository.save(row);
        return OtpResult.INVALID;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
