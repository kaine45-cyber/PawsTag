package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Bật/tắt lost mode. Khớp PUT /api/pets/{id}/lost-mode.
 */
public record LostModeRequest(
        @NotNull(message = "is required")
        Boolean isLost,

        String lostMessage,
        BigDecimal rewardAmount,
        Integer alertRadiusKm
) {}
