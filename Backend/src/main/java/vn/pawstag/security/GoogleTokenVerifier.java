package vn.pawstag.security;

/**
 * Verify Google ID token PHÍA BACKEND (không tin frontend decode).
 * Kiểm tra chữ ký, aud khớp GOOGLE_CLIENT_ID, issuer, hạn dùng.
 */
public interface GoogleTokenVerifier {

    /**
     * @param credential Google ID token (JWT) từ frontend.
     * @return thông tin tài khoản Google đã xác thực.
     * @throws vn.pawstag.exception.BadRequestException nếu token không hợp lệ.
     */
    Account verify(String credential);

    /** Các claim cần dùng từ Google ID token đã verify. */
    record Account(String sub, String email, boolean emailVerified, String name, String picture) {}
}
