package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.LostModeRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.response.PetResponse;

import java.util.List;

public interface PetService {
    PetResponse create(String ownerEmail, PetRequest request);
    List<PetResponse> list(String ownerEmail);
    PetResponse get(String ownerEmail, Long petId);
    PetResponse update(String ownerEmail, Long petId, PetRequest request);
    void delete(String ownerEmail, Long petId);
    PetResponse setLostMode(String ownerEmail, Long petId, LostModeRequest request);
    PetResponse setPhoto(String ownerEmail, Long petId, MultipartFile file);
}
