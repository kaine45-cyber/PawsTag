package vn.pawstag.dto.response;

/**
 * Trả về sau register/login: JWT + thông tin owner (khớp frontend AuthContext).
 */
public record AuthResponse(
        String token,
        OwnerResponse owner
) {}
