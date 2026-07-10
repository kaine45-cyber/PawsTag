package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.AuthResponse;
import vn.pawstag.service.AuthService;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Đăng ký / đăng nhập")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản (email + password)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse data = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(data, "Registered"));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng email + password → JWT")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Gửi mã OTP đặt lại mật khẩu về email")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.ok(null, "If this email is registered, a reset code has been sent.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Xác nhận mã OTP + đặt mật khẩu mới")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(null, "Password reset successfully");
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất (JWT stateless — client tự bỏ token)")
    public ApiResponse<Void> logout() {
        return ApiResponse.ok(null, "Logged out");
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập Google (Phase sau — chưa triển khai)")
    public ResponseEntity<ApiResponse<Void>> google() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error("Google login not implemented yet"));
    }

    @PostMapping("/facebook")
    @Operation(summary = "Đăng nhập Facebook (Phase sau — chưa triển khai)")
    public ResponseEntity<ApiResponse<Void>> facebook() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error("Facebook login not implemented yet"));
    }
}
