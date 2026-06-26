package vn.pawstag.dto.response;

import vn.pawstag.entity.Notification;
import vn.pawstag.util.TimeUtil;

/**
 * Khớp frontend types/response.ts Notification:
 * { id, type, title, body, time, unread, petId?, petAvatar? }.
 */
public record NotificationResponse(
        String id,
        String type,            // lowercase: scan/location/medical/alert/system
        String title,
        String body,
        String time,            // tương đối: "2 min ago"
        boolean unread,
        String petId,
        String petAvatar
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                String.valueOf(n.getId()),
                n.getType() != null ? n.getType().name().toLowerCase() : "system",
                n.getTitle(),
                n.getMessage(),
                TimeUtil.relative(n.getCreatedAt()),
                !n.isRead(),
                n.getPet() != null ? String.valueOf(n.getPet().getId()) : null,
                n.getPet() != null ? n.getPet().getPhotoUrl() : null
        );
    }
}
