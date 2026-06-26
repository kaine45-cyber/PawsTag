package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Ghi nhận một lần quét + chia sẻ vị trí. POST /api/scans (công khai).
 */
public record ScanRequest(
        @NotBlank(message = "is required")
        String publicCode,

        Double lat,
        Double lng,
        String userAgent,
        Boolean found        // người quét bấm "I found this pet"
) {}
