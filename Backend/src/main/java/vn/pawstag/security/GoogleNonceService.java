package vn.pawstag.security;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Nonce chống replay cho Google ID token: backend phát nonce, frontend truyền vào
 * GIS (google.accounts.id.initialize), Google nhúng vào claim "nonce" của credential,
 * backend đối chiếu và tiêu hủy (single-use). Token bị lộ không thể replay với nonce khác.
 * Lưu trong bộ nhớ (reset khi restart) — đủ cho app 1 instance, như LoginAttemptService.
 */
@Service
public class GoogleNonceService {

    private static final int TTL_MINUTES = 10;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Instant> issued = new ConcurrentHashMap<>();

    /** Phát nonce mới (base64url 32 byte ngẫu nhiên), hạn dùng 10 phút. */
    public String issue() {
        purgeExpired(); // dọn rác mỗi lần phát — map không phình khi bị spam
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        String nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
        issued.put(nonce, Instant.now().plus(TTL_MINUTES, ChronoUnit.MINUTES));
        return nonce;
    }

    /** Tiêu hủy nonce (single-use). true nếu nonce hợp lệ và còn hạn. */
    public boolean consume(String nonce) {
        if (nonce == null || nonce.isBlank()) return false;
        Instant expiry = issued.remove(nonce);
        return expiry != null && Instant.now().isBefore(expiry);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        issued.entrySet().removeIf(e -> now.isAfter(e.getValue()));
    }
}
