package vn.pawstag.dto.request;

public record NotificationPrefsRequest(
        Boolean scans,
        Boolean lost,
        Boolean updates
) {}
