package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.ChangePasswordRequest;
import vn.pawstag.dto.request.NotificationPrefsRequest;
import vn.pawstag.dto.request.OwnerUpdateRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.NotificationPrefsResponse;
import vn.pawstag.dto.response.OwnerResponse;
import vn.pawstag.service.OwnerService;

@RestController
@RequestMapping("/owners")
@Tag(name = "Owner", description = "Tài khoản chủ thú cưng")
@SecurityRequirement(name = "bearerAuth")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin owner đang đăng nhập")
    public ApiResponse<OwnerResponse> me(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(ownerService.getMe(principal.getUsername()));
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ (name/phone/city)")
    public ApiResponse<OwnerResponse> update(@AuthenticationPrincipal UserDetails principal,
                                             @Valid @RequestBody OwnerUpdateRequest request) {
        return ApiResponse.ok(ownerService.update(principal.getUsername(), request), "Profile updated");
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    @Operation(summary = "Tải lên ảnh đại diện")
    public ApiResponse<OwnerResponse> avatar(@AuthenticationPrincipal UserDetails principal,
                                             @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(ownerService.setAvatar(principal.getUsername(), file), "Avatar updated");
    }

    @PutMapping("/me/password")
    @Operation(summary = "Đổi mật khẩu")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal UserDetails principal,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        ownerService.changePassword(principal.getUsername(), request);
        return ApiResponse.ok(null, "Password changed");
    }

    @GetMapping("/me/notifications")
    @Operation(summary = "Lấy tùy chọn thông báo")
    public ApiResponse<NotificationPrefsResponse> getNotifPrefs(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(ownerService.getNotifPrefs(principal.getUsername()));
    }

    @PutMapping("/me/notifications")
    @Operation(summary = "Cập nhật tùy chọn thông báo")
    public ApiResponse<NotificationPrefsResponse> updateNotifPrefs(@AuthenticationPrincipal UserDetails principal,
                                                                   @RequestBody NotificationPrefsRequest request) {
        return ApiResponse.ok(ownerService.updateNotifPrefs(principal.getUsername(), request), "Preferences updated");
    }
}
