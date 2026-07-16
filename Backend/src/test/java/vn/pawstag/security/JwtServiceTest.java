package vn.pawstag.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import vn.pawstag.entity.Owner;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JWT sau khi đổi principal: subject = ownerId. Token cũ (subject = email,
 * phát trước khi đổi) vẫn đọc được ownerId qua claim — session không bị mất.
 */
class JwtServiceTest {

    private static final String SECRET = "test-secret-0123456789-0123456789-0123456789";
    private final JwtService jwtService = new JwtService(SECRET, 60_000);

    private Owner owner() {
        Owner o = new Owner();
        o.setId(42L);
        o.setEmail("a@b.com");
        o.setRole("USER");
        o.setAuthVersion(3);
        return o;
    }

    @Test
    void newToken_subjectIsOwnerId() {
        String token = jwtService.generateToken(owner());

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractOwnerId(token)).isEqualTo("42");
        assertThat(jwtService.isValidForAuthVersion(token, 3)).isTrue();
        assertThat(jwtService.isValidForAuthVersion(token, 4)).isFalse();
    }

    @Test
    void legacyToken_subjectEmail_fallsBackToOwnerIdClaim() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String legacy = Jwts.builder()
                .subject("a@b.com")             // token phát trước khi đổi subject
                .claim("ownerId", 42L)
                .claim("role", "USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();

        assertThat(jwtService.isValid(legacy)).isTrue();
        assertThat(jwtService.extractOwnerId(legacy)).isEqualTo("42");
        assertThat(jwtService.isValidForAuthVersion(legacy, 0)).isTrue();
        assertThat(jwtService.isValidForAuthVersion(legacy, 1)).isFalse();
    }

    @Test
    void tokenWithoutOwnerId_returnsNull() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String broken = Jwts.builder()
                .subject("a@b.com")             // không phải số, không có claim ownerId
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();

        assertThat(jwtService.extractOwnerId(broken)).isNull();
    }
}
