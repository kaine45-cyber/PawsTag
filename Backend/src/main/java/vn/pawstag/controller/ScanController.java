package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.pawstag.dto.request.ScanRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.ScanLogResponse;
import vn.pawstag.dto.response.ScanResultResponse;
import vn.pawstag.service.ScanService;

import java.util.List;

/**
 * Công khai — ghi nhận quét + chia sẻ vị trí (nút Send Location ở /t/{code}).
 */
@RestController
@RequestMapping("/scans")
@Tag(name = "Scans", description = "Ghi nhận lượt quét")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    @PostMapping
    @Operation(summary = "Ghi nhận một lượt quét (publicCode + lat/lng + userAgent)")
    public ResponseEntity<ApiResponse<ScanResultResponse>> record(
            @Valid @RequestBody ScanRequest request,
            HttpServletRequest http) {
        // Nếu client không gửi userAgent, lấy từ header.
        ScanRequest enriched = request.userAgent() != null ? request
                : new ScanRequest(request.publicCode(), request.lat(), request.lng(),
                http.getHeader("User-Agent"), request.found());
        ScanResultResponse data = scanService.record(enriched);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(data, "Scan recorded"));
    }

    @GetMapping("/history")
    @Operation(summary = "Lịch sử quét của owner (lọc theo petId nếu có)")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<ScanLogResponse>> history(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) Long petId) {
        return ApiResponse.ok(scanService.history(principal.getUsername(), petId));
    }
}
