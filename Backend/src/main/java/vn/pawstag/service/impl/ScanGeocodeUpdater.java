package vn.pawstag.service.impl;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import vn.pawstag.event.ScanRecordedEvent;
import vn.pawstag.repository.ScanLogRepository;
import vn.pawstag.service.GeocodingService;

/**
 * Chạy reverse-geocode NGOÀI transaction lưu scan (xem ScanServiceImpl.record()).
 * Gọi HTTP tới Nominatim có thể mất tới vài giây — nếu chạy trong transaction sẽ
 * giữ connection DB suốt thời gian đó. Lắng nghe sự kiện SAU KHI transaction lưu
 * scan đã commit (AFTER_COMMIT) — tránh race đọc row chưa commit; và @Async chạy
 * trên bean riêng để proxy AOP hoạt động (self-invocation sẽ bỏ qua @Async).
 */
@Component
public class ScanGeocodeUpdater {

    private final ScanLogRepository scanLogRepository;
    private final GeocodingService geocodingService;

    public ScanGeocodeUpdater(ScanLogRepository scanLogRepository, GeocodingService geocodingService) {
        this.scanLogRepository = scanLogRepository;
        this.geocodingService = geocodingService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional
    public void onScanRecorded(ScanRecordedEvent event) {
        if (event.lat() == null || event.lng() == null) return;
        String locationName = geocodingService.reverse(event.lat(), event.lng());
        if (locationName == null) return;
        scanLogRepository.findById(event.scanLogId()).ifPresent(entry -> {
            entry.setLocationName(locationName);
            scanLogRepository.save(entry);
        });
    }
}
