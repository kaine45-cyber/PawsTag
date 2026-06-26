package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.pawstag.dto.response.ApiResponse;

import java.time.Instant;
import java.util.Map;

/**
 * Health check Phase 0 — xác nhận app chạy + Swagger hiển thị endpoint.
 */
@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Service health probe")
public class HealthController {

    @GetMapping
    @Operation(summary = "Ping the service")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of(
                "status", "UP",
                "service", "pawstag-backend",
                "time", Instant.now().toString()
        ));
    }
}
