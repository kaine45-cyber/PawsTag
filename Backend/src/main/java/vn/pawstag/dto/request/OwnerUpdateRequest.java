package vn.pawstag.dto.request;

/**
 * Cập nhật hồ sơ owner (profile page). Tất cả optional.
 */
public record OwnerUpdateRequest(
        String name,
        String phone,
        String city
) {}
