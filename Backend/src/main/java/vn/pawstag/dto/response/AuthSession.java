package vn.pawstag.dto.response;

/**
 * Kết quả nội bộ sau login/register. Token dùng để set cookie HttpOnly,
 * không trả trực tiếp trong JSON response.
 */
public record AuthSession(
        String token,
        OwnerResponse owner
) {}
