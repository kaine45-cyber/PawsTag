package vn.pawstag.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * (ADMIN) Sinh N tag trống để in. POST /api/tags/batch.
 */
public record BatchTagRequest(
        @NotNull(message = "is required")
        @Min(value = 1, message = "must be at least 1")
        @Max(value = 500, message = "must be at most 500")
        Integer quantity
) {}
