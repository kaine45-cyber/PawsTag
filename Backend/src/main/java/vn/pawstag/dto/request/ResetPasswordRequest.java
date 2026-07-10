package vn.pawstag.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "is required")
        @Email(message = "must be a valid email")
        String email,

        @NotBlank(message = "is required")
        @Size(min = 6, max = 6, message = "must be 6 digits")
        String otp,

        @NotBlank(message = "is required")
        @Size(min = 8, message = "must be at least 8 characters")
        String newPassword
) {}
