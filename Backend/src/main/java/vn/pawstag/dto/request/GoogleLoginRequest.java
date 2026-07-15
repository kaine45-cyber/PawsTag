package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Đăng nhập/đăng ký bằng Google. Frontend gửi Google ID token (credential từ GIS).
 * Backend verify credential với Google trước khi tạo session. POST /auth/google.
 */
public record GoogleLoginRequest(
        @NotBlank(message = "is required")
        String credential
) {}
