package vn.pawstag.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.pawstag.entity.Owner;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Phát hành và xác thực JWT (HS256). Subject = ownerId; kèm claim ownerId, role.
 * (Trước đây subject = email — extractOwnerId vẫn đọc được token cũ qua claim ownerId.)
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Owner owner) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(owner.getId()))
                .claim("ownerId", owner.getId())
                .claim("role", owner.getRole())
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    /**
     * Lấy ownerId (dạng chuỗi số) từ token. Token mới: subject = ownerId.
     * Token cũ (subject = email, phát hành trước khi đổi): fallback về claim ownerId
     * để session đang hoạt động không bị logout.
     */
    public String extractOwnerId(String token) {
        Claims claims = parse(token);
        String sub = claims.getSubject();
        if (sub != null && !sub.isEmpty() && sub.chars().allMatch(Character::isDigit)) {
            return sub;
        }
        Object legacy = claims.get("ownerId");
        return legacy == null ? null : String.valueOf(legacy);
    }

    public boolean isValid(String token) {
        try {
            Date exp = parse(token).getExpiration();
            return exp != null && exp.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
