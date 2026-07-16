-- Giữ duy nhất OTP mới nhất cho mỗi email trước khi thêm unique constraint.
DELETE FROM password_reset_otps older
USING password_reset_otps newer
WHERE older.email = newer.email
  AND (
      older.created_at < newer.created_at
      OR (older.created_at = newer.created_at AND older.id < newer.id)
  );

DROP INDEX IF EXISTS idx_pwd_reset_email;
CREATE UNIQUE INDEX uq_pwd_reset_email ON password_reset_otps(email);

-- JWT chứa auth_version. Reset mật khẩu tăng giá trị này để thu hồi mọi JWT cũ.
ALTER TABLE owners
    ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
