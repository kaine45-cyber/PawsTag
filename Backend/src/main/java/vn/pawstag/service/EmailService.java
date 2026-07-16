package vn.pawstag.service;

public interface EmailService {
    /** Xếp lịch gửi mã OTP quên mật khẩu; không chặn HTTP response. */
    void sendPasswordResetOtp(String toEmail, String otp, int expiryMinutes);

    /** Thông báo bảo mật sau khi mật khẩu đã được thay đổi thành công. */
    void sendPasswordChangedNotice(String toEmail);
}
