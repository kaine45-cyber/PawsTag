package vn.pawstag.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Khớp frontend authService.register({ name, email, password }).
 * phone nullable — form register không thu.
 */
public record RegisterRequest(
        @NotBlank(message = "is required")
        String name,

        @NotBlank(message = "is required")
        @Email(message = "must be a valid email")
        String email,

        @NotBlank(message = "is required")
        @Size(min = 8, max = 72, message = "must be between 8 and 72 characters")
        String password,

        String phone
) {}
