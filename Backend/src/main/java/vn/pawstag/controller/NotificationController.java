package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.NotificationResponse;
import vn.pawstag.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Thông báo của owner")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Danh sách thông báo")
    public ApiResponse<List<NotificationResponse>> list(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(notificationService.list(principal.getUsername()));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu đã đọc 1 thông báo")
    public ApiResponse<NotificationResponse> markRead(@AuthenticationPrincipal UserDetails principal,
                                                      @PathVariable Long id) {
        return ApiResponse.ok(notificationService.markRead(principal.getUsername(), id));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả đã đọc")
    public ApiResponse<Map<String, Integer>> markAllRead(@AuthenticationPrincipal UserDetails principal) {
        int updated = notificationService.markAllRead(principal.getUsername());
        return ApiResponse.ok(Map.of("updated", updated));
    }

    @DeleteMapping
    @Operation(summary = "Xóa tất cả thông báo")
    public ApiResponse<Map<String, Long>> clearAll(@AuthenticationPrincipal UserDetails principal) {
        long deleted = notificationService.clearAll(principal.getUsername());
        return ApiResponse.ok(Map.of("deleted", deleted));
    }
}
