package vn.pawstag.dto.request;

/**
 * Bật/tắt liên kết NFC cho tag. POST /api/tags/{id}/nfc.
 * enabled null ⇒ mặc định true (đánh dấu đã ghi NFC).
 */
public record NfcRequest(
        Boolean enabled
) {}
