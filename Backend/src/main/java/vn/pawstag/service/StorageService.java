package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /** Lưu file ảnh vào subdir (pets/avatars), trả về URL công khai đầy đủ. */
    String store(MultipartFile file, String subdir);
}
