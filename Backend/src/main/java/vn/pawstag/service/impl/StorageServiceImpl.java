package vn.pawstag.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.service.StorageService;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

/** Stores public pet and avatar images in Supabase Storage instead of local disk. */
@Service
public class StorageServiceImpl implements StorageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Pattern BUCKET_NAME = Pattern.compile("[a-z0-9][a-z0-9-]{1,62}");

    private final String storageApiUrl;
    private final String serviceRoleKey;
    private final String bucket;
    private final HttpClient httpClient;
    private final AtomicBoolean bucketReady = new AtomicBoolean(false);

    public StorageServiceImpl(
            @Value("${app.storage.supabase-url:}") String supabaseUrl,
            @Value("${app.storage.service-role-key:}") String serviceRoleKey,
            @Value("${app.storage.bucket:pawstag-media}") String bucket) {
        String normalizedUrl = supabaseUrl == null ? "" : supabaseUrl.trim().replaceAll("/+$", "");
        this.storageApiUrl = normalizedUrl.isEmpty() ? "" : normalizedUrl + "/storage/v1";
        this.serviceRoleKey = serviceRoleKey == null ? "" : serviceRoleKey.trim();
        this.bucket = bucket == null ? "" : bucket.trim();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    @Override
    public String store(MultipartFile file, String subdir) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType)) {
            throw new BadRequestException("Only JPG, PNG or WEBP images are allowed");
        }
        requireConfiguration();
        ensurePublicBucket();

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String objectPath = subdir + "/" + UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            HttpRequest request = requestBuilder("/object/" + bucket + "/" + objectPath)
                    .header("Content-Type", contentType)
                    .PUT(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() / 100 != 2) {
                throw new BadRequestException("Could not upload image. Please try again.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Could not upload image. Please try again.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Could not upload image. Please try again.");
        }

        // Pet photos appear on public QR pages, so this bucket intentionally has public read access.
        return storageApiUrl + "/object/public/" + bucket + "/" + objectPath;
    }

    private void requireConfiguration() {
        if (storageApiUrl.isBlank() || serviceRoleKey.isBlank() || !BUCKET_NAME.matcher(bucket).matches()) {
            throw new BadRequestException("Image storage is not configured. Please contact support.");
        }
    }

    /** Creates the configured public bucket once. HTTP 409 means it already exists. */
    private void ensurePublicBucket() {
        if (bucketReady.get()) return;
        synchronized (bucketReady) {
            if (bucketReady.get()) return;
            String payload = "{\"id\":\"" + bucket + "\",\"name\":\"" + bucket + "\",\"public\":true}";
            try {
                HttpRequest request = requestBuilder("/bucket")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();
                HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() / 100 != 2 && response.statusCode() != 409) {
                    throw new BadRequestException("Image storage is unavailable. Please try again later.");
                }
                bucketReady.set(true);
            } catch (IOException e) {
                throw new BadRequestException("Image storage is unavailable. Please try again later.");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BadRequestException("Image storage is unavailable. Please try again later.");
            }
        }
    }

    private HttpRequest.Builder requestBuilder(String path) {
        return HttpRequest.newBuilder(URI.create(storageApiUrl + path))
                .timeout(Duration.ofSeconds(15))
                // Service Role must remain on the backend. Never expose it through NEXT_PUBLIC_*.
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey);
    }
}
