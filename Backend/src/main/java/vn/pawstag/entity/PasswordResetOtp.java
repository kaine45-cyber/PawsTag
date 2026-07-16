package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * OTP quên mật khẩu (1 dòng = 1 mã đang/đã dùng cho 1 email).
 * Chỉ lưu HASH của OTP. Bảng: password_reset_otps (Flyway V12).
 */
@Entity
@Table(
        name = "password_reset_otps",
        uniqueConstraints = @UniqueConstraint(name = "uq_pwd_reset_email", columnNames = "email")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_sent_at", nullable = false)
    private Instant lastSentAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (lastSentAt == null) lastSentAt = now;
    }
}
