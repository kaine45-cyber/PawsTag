package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.GoogleLoginRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.AuthResponse;
import vn.pawstag.dto.response.AuthSession;
import vn.pawstag.dto.response.ForgotPasswordResponse;
import vn.pawstag.service.AuthService;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Register / login")
public class AuthController {

    private static final String AUTH_COOKIE = "access_token";

    private final AuthService authService;
    private final long jwtExpirationMs;

    public AuthController(AuthService authService,
                          @Value("${app.jwt.expiration-ms}") long jwtExpirationMs) {
        this.authService = authService;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    @PostMapping("/register")
    @Operation(summary = "Register with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest http) {
        return authenticated(authService.register(request), "Registered", HttpStatus.CREATED, http);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest http) {
        return authenticated(authService.login(request), "Logged in", HttpStatus.OK, http);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset OTP by email")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        int cooldownSeconds = authService.forgotPassword(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(cooldownSeconds))
                .body(ApiResponse.ok(
                        new ForgotPasswordResponse(cooldownSeconds),
                        "If this email is registered, a reset code has been sent."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Verify OTP and set a new password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(null, "Password reset successfully");
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and clear auth cookie")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest http) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie(http).toString())
                .body(ApiResponse.ok(null, "Logged out"));
    }

    @PostMapping("/google")
    @Operation(summary = "Login/Register with a Google ID token")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request,
                                                            HttpServletRequest http) {
        return authenticated(authService.googleLogin(request), "Logged in", HttpStatus.OK, http);
    }

    @PostMapping("/facebook")
    @Operation(summary = "Facebook login placeholder")
    public ResponseEntity<ApiResponse<Void>> facebook() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error("Facebook login not implemented yet"));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> authenticated(AuthSession session,
                                                                    String message,
                                                                    HttpStatus status,
                                                                    HttpServletRequest http) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, authCookie(session.token(), http).toString())
                .body(ApiResponse.ok(new AuthResponse(session.owner()), message));
    }

    private ResponseCookie authCookie(String token, HttpServletRequest http) {
        return ResponseCookie.from(AUTH_COOKIE, token)
                .httpOnly(true)
                .secure(isSecureRequest(http))
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs))
                .build();
    }

    private ResponseCookie clearCookie(HttpServletRequest http) {
        return ResponseCookie.from(AUTH_COOKIE, "")
                .httpOnly(true)
                .secure(isSecureRequest(http))
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String proto = request.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) return false;
        return proto.split(",")[0].trim().equalsIgnoreCase("https");
    }
}
