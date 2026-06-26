package vn.pawstag.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Khớp frontend authService.login({ email, password }).
 */
public record LoginRequest(
        @NotBlank(message = "is required")
        @Email(message = "must be a valid email")
        String email,

        @NotBlank(message = "is required")
        String password
) {}
