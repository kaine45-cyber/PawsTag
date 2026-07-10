package vn.pawstag.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.pawstag.service.GeocodingService;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;

@Service
public class GeocodingServiceImpl implements GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingServiceImpl.class);

    private final boolean enabled;
    private final String nominatimBaseUrl;
    private final String goongBaseUrl;
    private final String goongApiKey;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public GeocodingServiceImpl(
            @Value("${app.geocoding.enabled:true}") boolean enabled,
            @Value("${app.geocoding.url:https://nominatim.openstreetmap.org}") String nominatimBaseUrl,
            @Value("${app.geocoding.goong-url:https://rsapi.goong.io}") String goongBaseUrl,
            @Value("${app.geocoding.goong-api-key:}") String goongApiKey) {
        this.enabled = enabled;
        this.nominatimBaseUrl = trimTrailingSlash(nominatimBaseUrl);
        this.goongBaseUrl = trimTrailingSlash(goongBaseUrl);
        this.goongApiKey = goongApiKey == null ? "" : goongApiKey.trim();
    }

    @Override
    public String reverse(Double lat, Double lng) {
        if (!enabled || lat == null || lng == null) return null;

        if (!goongApiKey.isBlank()) {
            String goongAddress = reverseWithGoong(lat, lng);
            if (goongAddress != null) return goongAddress;
        }

        return reverseWithNominatim(lat, lng);
    }

    private String reverseWithGoong(Double lat, Double lng) {
        try {
            String encodedKey = URLEncoder.encode(goongApiKey, StandardCharsets.UTF_8);
            String url = String.format(Locale.US, "%s/geocode?latlng=%.6f,%.6f&api_key=%s",
                    goongBaseUrl, lat, lng, encodedKey);

            HttpResponse<String> res = sendGet(url);
            if (res.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(res.body());
            JsonNode firstResult = root.path("results").path(0);
            if (firstResult.isMissingNode()) return null;

            return trimAddress(firstResult.path("formatted_address").asText(null));
        } catch (Exception e) {
            log.debug("Goong reverse geocode failed: {}", e.getMessage());
            return null;
        }
    }

    private String reverseWithNominatim(Double lat, Double lng) {
        try {
            String url = String.format(Locale.US,
                    "%s/reverse?format=jsonv2&lat=%f&lon=%f&zoom=14&addressdetails=1",
                    nominatimBaseUrl, lat, lng);

            HttpResponse<String> res = sendGet(url);
            if (res.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(res.body());
            JsonNode addr = root.path("address");
            String area = firstNonEmpty(addr, "suburb", "quarter", "neighbourhood", "city_district", "village", "hamlet", "road");
            String city = firstNonEmpty(addr, "city", "town", "state", "county");
            if (area != null && city != null) return area + ", " + city;
            if (city != null) return city;
            if (area != null) return area;

            return trimAddress(root.path("display_name").asText(null));
        } catch (Exception e) {
            log.debug("Nominatim reverse geocode failed: {}", e.getMessage());
            return null;
        }
    }

    private HttpResponse<String> sendGet(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "PawsTag/1.0 (pet-tag-app)")
                .header("Accept-Language", "vi")
                .timeout(Duration.ofSeconds(4))
                .GET()
                .build();
        return http.send(req, HttpResponse.BodyHandlers.ofString());
    }

    private String firstNonEmpty(JsonNode addr, String... keys) {
        for (String k : keys) {
            String v = addr.path(k).asText(null);
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private String trimAddress(String value) {
        if (value == null || value.isBlank()) return null;
        return value.length() > 80 ? value.substring(0, 80) + "..." : value;
    }

    private String trimTrailingSlash(String value) {
        return value == null ? "" : value.replaceAll("/+$", "");
    }
}
