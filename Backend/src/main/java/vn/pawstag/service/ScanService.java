package vn.pawstag.service;

import vn.pawstag.dto.request.ScanRequest;
import vn.pawstag.dto.response.PublicScanResponse;
import vn.pawstag.dto.response.ScanLogResponse;
import vn.pawstag.dto.response.ScanResultResponse;

import java.util.List;

public interface ScanService {

    /** Tra cứu công khai theo public_code, đã lọc privacy ở server. */
    PublicScanResponse lookup(String publicCode);

    /** Ghi nhận một lần quét (+ chia sẻ vị trí). */
    ScanResultResponse record(ScanRequest request);

    /** Lịch sử quét của owner; lọc theo pet nếu petId != null. */
    List<ScanLogResponse> history(String ownerEmail, Long petId);
}
