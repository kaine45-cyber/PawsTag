-- V12: OTP quên mật khẩu lưu trong DB (thay ConcurrentHashMap in-RAM).
-- Chỉ lưu HASH của OTP (không lưu plaintext). Đủ cột cho cooldown, đếm số lần sai, đánh dấu đã dùng.
CREATE TABLE password_reset_otps (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,        -- email chủ tài khoản (đã lowercase)
    otp_hash      VARCHAR(255) NOT NULL,        -- BCrypt hash của OTP 6 số
    expires_at    TIMESTAMP    NOT NULL,        -- hết hạn sau OTP_EXPIRY_MINUTES
    attempt_count INTEGER      NOT NULL DEFAULT 0,   -- số lần nhập sai; quá OTP_MAX_ATTEMPTS thì huỷ
    used_at       TIMESTAMP,                    -- != null nghĩa là đã dùng để reset → không dùng lại
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    last_sent_at  TIMESTAMP    NOT NULL DEFAULT now()   -- lần gửi gần nhất → dùng cho cooldown resend
);

CREATE INDEX idx_pwd_reset_email ON password_reset_otps(email);
