package vn.pawstag.event;

/**
 * Phát ra sau khi 1 ScanLog được lưu, để trigger reverse-geocode chạy nền
 * (xem vn.pawstag.service.impl.ScanGeocodeUpdater). Tách khỏi transaction lưu scan
 * vì gọi Nominatim (HTTP) có thể mất vài giây — không nên giữ connection DB chờ.
 */
public record ScanRecordedEvent(Long scanLogId, Double lat, Double lng) {
}
