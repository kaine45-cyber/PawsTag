package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.ChangePasswordRequest;
import vn.pawstag.dto.request.NotificationPrefsRequest;
import vn.pawstag.dto.request.OwnerUpdateRequest;
import vn.pawstag.dto.response.NotificationPrefsResponse;
import vn.pawstag.dto.response.OwnerResponse;

public interface OwnerService {
    OwnerResponse getMe(String email);
    OwnerResponse update(String email, OwnerUpdateRequest request);
    OwnerResponse setAvatar(String email, MultipartFile file);
    void changePassword(String email, ChangePasswordRequest request);
    NotificationPrefsResponse getNotifPrefs(String email);
    NotificationPrefsResponse updateNotifPrefs(String email, NotificationPrefsRequest request);
}
