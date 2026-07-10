package vn.pawstag.service;

import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);

    /** Gửi mã OTP về email nếu tài khoản tồn tại. Luôn "thành công" ở phía client (chống dò email). */
    void forgotPassword(ForgotPasswordRequest request);

    /** Xác nhận OTP + đặt mật khẩu mới. */
    void resetPassword(ResetPasswordRequest request);
}
