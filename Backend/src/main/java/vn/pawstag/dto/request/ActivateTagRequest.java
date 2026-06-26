package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Gán một public_code (tag chưa dùng) vào pet. POST /api/tags/activate.
 */
public record ActivateTagRequest(
        @NotBlank(message = "is required")
        String publicCode,

        @NotNull(message = "is required")
        Long petId
) {}
