package vn.pawstag.dto.response;

/**
 * Phản hồi sau khi ghi nhận scan (cho nút Send Location ở /t/{code}).
 */
public record ScanResultResponse(
        String id,
        String scannedAt
) {}
