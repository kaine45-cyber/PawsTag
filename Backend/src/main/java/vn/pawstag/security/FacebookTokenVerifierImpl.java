package vn.pawstag.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.pawstag.exception.BadRequestException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;

/**
 * Verify Facebook access token bằng Graph API (HTTP client JDK, cùng pattern GeocodingServiceImpl):
 *  1) /debug_token với app token → is_valid && app_id khớp app này (chặn token phát cho app khác).
 *  2) /me kèm appsecret_proof (HMAC-SHA256 của token với app secret) → id, name, email, picture.
 * Chưa cấu hình app-id/app-secret → mọi token bị từ chối (fail-safe như GoogleTokenVerifierImpl).
 * Không log credential/token.
 */
@Service
public class FacebookTokenVerifierImpl implements FacebookTokenVerifier {

    private static final String GRAPH = "https://graph.facebook.com/v19.0";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    private final String appId;
    private final String appSecret;

    public FacebookTokenVerifierImpl(@Value("${app.facebook.app-id:}") String appId,
                                     @Value("${app.facebook.app-secret:}") String appSecret) {
        this.appId = appId == null ? "" : appId.trim();
        this.appSecret = appSecret == null ? "" : appSecret.trim();
    }

    @Override
    public Account verify(String accessToken) {
        if (appId.isBlank() || appSecret.isBlank()) {
            throw new BadRequestException("Invalid Facebook token"); // chưa cấu hình → từ chối
        }
        try {
            String encToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);

            // 1) Token có hợp lệ và được phát cho đúng app này không?
            JsonNode debug = getJson(GRAPH + "/debug_token?input_token=" + encToken
                    + "&access_token=" + URLEncoder.encode(appId + "|" + appSecret, StandardCharsets.UTF_8))
                    .path("data");
            if (!debug.path("is_valid").asBoolean(false) || !appId.equals(debug.path("app_id").asText())) {
                throw new BadRequestException("Invalid Facebook token");
            }

            // 2) Lấy profile. appsecret_proof để Graph API từ chối token bị đánh cắp gọi từ server lạ.
            JsonNode me = getJson(GRAPH + "/me?fields=id,name,email,picture.type(large)"
                    + "&access_token=" + encToken
                    + "&appsecret_proof=" + hmacSha256Hex(accessToken, appSecret));
            String id = me.path("id").asText(null);
            if (id == null || !id.equals(debug.path("user_id").asText())) {
                throw new BadRequestException("Invalid Facebook token");
            }
            String email = me.hasNonNull("email") ? me.get("email").asText() : null; // FB có thể không trả email
            String picture = me.path("picture").path("data").path("url").asText(null);
            return new Account(id, email, me.path("name").asText(null), picture);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            // Không log token. Chỉ báo chung chung.
            throw new BadRequestException("Invalid Facebook token");
        }
    }

    private JsonNode getJson(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() / 100 != 2) {
            throw new BadRequestException("Invalid Facebook token");
        }
        return mapper.readTree(res.body());
    }

    private static String hmacSha256Hex(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}
