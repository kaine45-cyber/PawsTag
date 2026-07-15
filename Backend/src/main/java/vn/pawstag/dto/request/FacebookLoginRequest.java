package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Đăng nhập/đăng ký bằng Facebook. Frontend gửi user access token (từ FB.login).
 * Backend verify với Graph API trước khi tạo session. POST /auth/facebook.
 */
public record FacebookLoginRequest(
        @NotBlank(message = "is required")
        String accessToken
) {}
