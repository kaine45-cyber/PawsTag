package vn.pawstag.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.pawstag.service.GeocodingService;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;

/**
 * Reverse-geocode bằng OpenStreetMap Nominatim (miễn phí, không cần key).
 * Tôn trọng usage policy: gửi User-Agent, gọi best-effort (lỗi/timeout → null).
 */
@Service
public class GeocodingServiceImpl implements GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingServiceImpl.class);

    private final boolean enabled;
    private final String baseUrl;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public GeocodingServiceImpl(
            @Value("${app.geocoding.enabled:true}") boolean enabled,
            @Value("${app.geocoding.url:https://nominatim.openstreetmap.org}") String baseUrl) {
        this.enabled = enabled;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
    }

    @Override
    public String reverse(Double lat, Double lng) {
        if (!enabled || lat == null || lng == null) return null;
        try {
            String url = String.format(Locale.US,
                    "%s/reverse?format=jsonv2&lat=%f&lon=%f&zoom=14&addressdetails=1",
                    baseUrl, lat, lng);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("User-Agent", "PawsTag/1.0 (pet-tag-app)")
                    .header("Accept-Language", "en")
                    .timeout(Duration.ofSeconds(4))
                    .GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(res.body());
            JsonNode addr = root.path("address");
            String area = firstNonEmpty(addr, "suburb", "quarter", "neighbourhood", "city_district", "village", "hamlet", "road");
            String city = firstNonEmpty(addr, "city", "town", "state", "county");
            if (area != null && city != null) return area + ", " + city;
            if (city != null) return city;
            if (area != null) return area;
            String dn = root.path("display_name").asText(null);
            return dn != null && dn.length() > 60 ? dn.substring(0, 60) + "…" : dn;
        } catch (Exception e) {
            log.debug("Reverse geocode failed: {}", e.getMessage());
            return null;
        }
    }

    private String firstNonEmpty(JsonNode addr, String... keys) {
        for (String k : keys) {
            String v = addr.path(k).asText(null);
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
