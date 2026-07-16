package vn.pawstag.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import vn.pawstag.security.JwtAuthFilter;
import vn.pawstag.security.SpaCsrfTokenRequestHandler;

/**
 * Stateless + JWT (cookie HttpOnly) + CSRF double-submit cookie.
 *   permitAll : /auth/**, /public/**, POST /scans, health, swagger/openapi
 *   ADMIN     : POST /tags/batch  (controller có ở Phase 3)
 *   còn lại   : authenticated
 * CSRF: auth chạy bằng cookie tự gửi nên bật lại CSRF (XSRF-TOKEN cookie, axios
 * tự gắn header X-XSRF-TOKEN). Miễn cho POST /scans: endpoint công khai ghi lượt
 * quét từ trang t/[code] — khách lần đầu chưa có cookie XSRF và endpoint không
 * dựa vào cookie auth nên CSRF không có ý nghĩa ở đó.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Path=/ bắt buộc: context-path là /api nên mặc định cookie XSRF-TOKEN có
        // Path=/api → document.cookie ở các trang (/login, /t/..) KHÔNG đọc được
        // → axios không gắn header X-XSRF-TOKEN → mọi POST auth bị 403.
        CookieCsrfTokenRepository csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepo.setCookiePath("/");
        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepo)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                        .ignoringRequestMatchers("/scans"))
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/**",
                                "/public/**",
                                "/uploads/**",
                                "/health",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/scans").permitAll()
                        .requestMatchers(HttpMethod.POST, "/tags/batch").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
