package vn.pawstag.security;

/**
 * Verify Facebook access token PHÍA BACKEND (không tin frontend).
 * Xác thực qua Graph API: debug_token (is_valid + app_id khớp) rồi /me (kèm appsecret_proof).
 */
public interface FacebookTokenVerifier {

    /**
     * @param accessToken Facebook user access token từ frontend (FB.login).
     * @return thông tin tài khoản Facebook đã xác thực; email CÓ THỂ null.
     * @throws vn.pawstag.exception.BadRequestException nếu token không hợp lệ.
     */
    Account verify(String accessToken);

    /** Claim cần dùng. email = null nếu user đăng ký bằng SĐT hoặc từ chối quyền email. */
    record Account(String id, String email, String name, String picture) {}
}
