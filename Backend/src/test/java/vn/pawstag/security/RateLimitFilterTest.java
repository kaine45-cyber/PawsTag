package vn.pawstag.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final FilterChain passThrough = (request, response) -> { };

    @Test
    void spoofedForwardedForCannotBypassRemoteAddressLimit() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1);

        MockHttpServletRequest first = authRequest("203.0.113.10", "198.51.100.1");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(first, firstResponse, passThrough);

        MockHttpServletRequest second = authRequest("203.0.113.10", "198.51.100.2");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(second, secondResponse, passThrough);

        assertThat(firstResponse.getStatus()).isEqualTo(200);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    private MockHttpServletRequest authRequest(String remoteAddress, String spoofedForwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/forgot-password");
        request.setServletPath("/auth/forgot-password");
        request.setRemoteAddr(remoteAddress);
        request.addHeader("X-Forwarded-For", spoofedForwardedFor);
        return request;
    }
}
