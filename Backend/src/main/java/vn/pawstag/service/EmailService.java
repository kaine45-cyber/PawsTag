package vn.pawstag.service;

public interface EmailService {
    /** Gửi mã OTP quên mật khẩu tới email. Ném RuntimeException nếu gửi thất bại. */
    void sendPasswordResetOtp(String toEmail, String otp, int expiryMinutes);
}
