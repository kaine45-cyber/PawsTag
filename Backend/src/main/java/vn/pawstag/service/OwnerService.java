package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.ChangePasswordRequest;
import vn.pawstag.dto.request.NotificationPrefsRequest;
import vn.pawstag.dto.request.OwnerUpdateRequest;
import vn.pawstag.dto.response.NotificationPrefsResponse;
import vn.pawstag.dto.response.OwnerResponse;

public interface OwnerService {
    OwnerResponse getMe(String principal);
    OwnerResponse update(String principal, OwnerUpdateRequest request);
    OwnerResponse setAvatar(String principal, MultipartFile file);
    void changePassword(String principal, ChangePasswordRequest request);
    NotificationPrefsResponse getNotifPrefs(String principal);
    NotificationPrefsResponse updateNotifPrefs(String principal, NotificationPrefsRequest request);
}
