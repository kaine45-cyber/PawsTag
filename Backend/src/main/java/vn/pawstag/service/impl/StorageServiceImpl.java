package vn.pawstag.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.service.StorageService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageServiceImpl implements StorageService {

    private static final Set<String> ALLOWED =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final String uploadDir;
    private final String baseUrl;

    public StorageServiceImpl(
            @Value("${app.upload.dir}") String uploadDir,
            @Value("${app.upload.base-url}") String baseUrl) {
        this.uploadDir = uploadDir;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
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

        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;

        try {
            Path dir = Paths.get(uploadDir, subdir).toAbsolutePath();
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target);
        } catch (IOException e) {
            throw new BadRequestException("Could not store file: " + e.getMessage());
        }

        // URL công khai: {base-url}/uploads/{subdir}/{filename}
        return baseUrl + "/uploads/" + subdir + "/" + filename;
    }
}
