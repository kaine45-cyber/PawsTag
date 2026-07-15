package vn.pawstag.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.pawstag.exception.BadRequestException;

import java.util.Collections;
import java.util.List;

/**
 * Verify Google ID token bằng thư viện chính chủ google-api-client:
 * kiểm tra chữ ký (JWKS của Google), issuer (accounts.google.com), hạn dùng, và
 * aud khớp GOOGLE_CLIENT_ID (setAudience). Không log credential/token.
 */
@Service
public class GoogleTokenVerifierImpl implements GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierImpl(@Value("${app.google.client-id:}") String clientId) {
        List<String> audience = (clientId == null || clientId.isBlank())
                ? Collections.emptyList()          // chưa cấu hình → mọi token bị từ chối
                : Collections.singletonList(clientId.trim());
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(audience)
                .build();
    }

    @Override
    public Account verify(String credential) {
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(credential); // null nếu chữ ký/aud/iss/exp không hợp lệ
        } catch (Exception e) {
            // Không log credential/token. Chỉ báo chung chung.
            throw new BadRequestException("Invalid Google token");
        }
        if (idToken == null) {
            throw new BadRequestException("Invalid Google token");
        }
        GoogleIdToken.Payload p = idToken.getPayload();
        return new Account(
                p.getSubject(),
                p.getEmail(),
                Boolean.TRUE.equals(p.getEmailVerified()),
                (String) p.get("name"),
                (String) p.get("picture"));
    }
}
