package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.OwnerUpdateRequest;
import vn.pawstag.dto.response.OwnerResponse;

public interface OwnerService {
    OwnerResponse getMe(String email);
    OwnerResponse update(String email, OwnerUpdateRequest request);
    OwnerResponse setAvatar(String email, MultipartFile file);
}
