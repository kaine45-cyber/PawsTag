package vn.pawstag.dto.response;

public record ForgotPasswordResponse(
        int resendCooldownSeconds
) {}
