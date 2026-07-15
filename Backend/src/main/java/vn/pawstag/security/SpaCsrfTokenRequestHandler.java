package vn.pawstag.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * CSRF handler cho SPA (double-submit cookie XSRF-TOKEN) — theo docs Spring Security
 * mục "Single Page Applications":
 *  - handle(): ép load token mỗi request để CookieCsrfTokenRepository ghi cookie
 *    (kể cả trên response 401 đầu tiên) → frontend luôn nhận được XSRF-TOKEN.
 *  - resolveCsrfTokenValue(): header X-XSRF-TOKEN (axios gửi nguyên giá trị cookie)
 *    → dùng handler plain; form param → dùng Xor (chống BREACH).
 */
public final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        xor.handle(request, response, csrfToken);
        csrfToken.get(); // ép render token → cookie được set ngay từ request đầu tiên
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String headerValue = request.getHeader(csrfToken.getHeaderName());
        return (StringUtils.hasText(headerValue) ? plain : xor).resolveCsrfTokenValue(request, csrfToken);
    }
}
