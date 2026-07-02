package vn.pawstag.dto.response;

import vn.pawstag.entity.Owner;

public record NotificationPrefsResponse(boolean scans, boolean lost, boolean updates) {
    public static NotificationPrefsResponse from(Owner o) {
        return new NotificationPrefsResponse(o.isNotifScans(), o.isNotifLost(), o.isNotifUpdates());
    }
}
