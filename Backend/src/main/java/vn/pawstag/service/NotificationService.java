package vn.pawstag.service;

import vn.pawstag.dto.response.NotificationResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.enums.NotificationType;

import java.util.List;

public interface NotificationService {

    /** Tạo thông báo (gọi nội bộ, ví dụ khi pet bị quét). */
    void create(Owner owner, Pet pet, NotificationType type, String title, String message);

    List<NotificationResponse> list(String ownerEmail);

    NotificationResponse markRead(String ownerEmail, Long id);

    int markAllRead(String ownerEmail);

    long clearAll(String ownerEmail);
}
