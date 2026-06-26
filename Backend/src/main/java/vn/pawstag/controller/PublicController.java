package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.PublicScanResponse;
import vn.pawstag.service.ScanService;

/**
 * Công khai (không cần đăng nhập) — trang quét QR /t/{code} và /n/{code}.
 */
@RestController
@RequestMapping("/public")
@Tag(name = "Public", description = "Tra cứu công khai khi quét tag")
public class PublicController {

    private final ScanService scanService;

    public PublicController(ScanService scanService) {
        this.scanService = scanService;
    }

    @GetMapping("/t/{code}")
    @Operation(summary = "Tra cứu hồ sơ công khai theo public_code (đã lọc privacy)")
    public ApiResponse<PublicScanResponse> lookup(@PathVariable String code) {
        return ApiResponse.ok(scanService.lookup(code));
    }
}
