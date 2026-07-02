package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "is required")
        String currentPassword,

        @NotBlank(message = "is required")
        @Size(min = 8, message = "must be at least 8 characters")
        String newPassword
) {}
