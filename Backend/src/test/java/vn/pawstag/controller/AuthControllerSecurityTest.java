package vn.pawstag.controller;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import vn.pawstag.config.SecurityConfig;
import vn.pawstag.dto.response.AuthSession;
import vn.pawstag.security.CustomUserDetailsService;
import vn.pawstag.security.GoogleNonceService;
import vn.pawstag.security.JwtAuthFilter;
import vn.pawstag.security.JwtService;
import vn.pawstag.service.AuthService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
@TestPropertySource(properties = {
        "app.jwt.expiration-ms=86400000",
        "app.ratelimit.per-minute=100"
})
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private GoogleNonceService googleNonceService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void loginLogoutLogin_rotatesCookiesAndAllowsSecondLogin() throws Exception {
        when(authService.login(any())).thenReturn(new AuthSession("jwt-token", null));

        Cookie firstCsrf = issueCsrf();
        login(firstCsrf)
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(cookie().path("access_token", "/"));

        MvcResult logout = mvc.perform(post("/auth/logout")
                        .cookie(firstCsrf)
                        .header("X-XSRF-TOKEN", firstCsrf.getValue()))
                .andExpect(status().isOk())
                .andReturn();

        List<String> clearedCookies = logout.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(clearedCookies).anySatisfy(value -> {
            assertThat(value).startsWith("access_token=");
            assertThat(value).contains("Max-Age=0", "Path=/");
        });
        assertThat(clearedCookies).anySatisfy(value -> {
            assertThat(value).startsWith("XSRF-TOKEN=");
            assertThat(value).contains("Max-Age=0", "Path=/");
        });

        Cookie secondCsrf = issueCsrf();
        assertThat(secondCsrf.getValue()).isNotEqualTo(firstCsrf.getValue());

        login(secondCsrf)
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"));

        verify(authService, times(2)).login(any());
    }

    private Cookie issueCsrf() throws Exception {
        MvcResult result = mvc.perform(get("/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().path("XSRF-TOKEN", "/"))
                .andReturn();
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return cookie;
    }

    private org.springframework.test.web.servlet.ResultActions login(Cookie csrf) throws Exception {
        return mvc.perform(post("/auth/login")
                .cookie(csrf)
                .header("X-XSRF-TOKEN", csrf.getValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"owner@pawstag.vn\",\"password\":\"password123\"}"));
    }
}
