package vn.pawstag.service;

import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.GoogleLoginRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.AuthSession;

public interface AuthService {
    AuthSession register(RegisterRequest request);
    AuthSession login(LoginRequest request);

    /** Đăng nhập/đăng ký bằng Google ID token (verify với Google, tìm/link/tạo owner). */
    AuthSession googleLogin(GoogleLoginRequest request);

    /** Gửi mã OTP về email nếu tài khoản tồn tại. Luôn "thành công" ở phía client (chống dò email). */
    int forgotPassword(ForgotPasswordRequest request);

    /** Xác nhận OTP + đặt mật khẩu mới. */
    void resetPassword(ResetPasswordRequest request);
}
