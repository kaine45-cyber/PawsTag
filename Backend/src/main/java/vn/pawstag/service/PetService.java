package vn.pawstag.service;

import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.LostModeRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.response.PetResponse;

import java.util.List;

public interface PetService {
    PetResponse create(String ownerPrincipal, PetRequest request);
    List<PetResponse> list(String ownerPrincipal);
    PetResponse get(String ownerPrincipal, Long petId);
    PetResponse update(String ownerPrincipal, Long petId, PetRequest request);
    void delete(String ownerPrincipal, Long petId);
    PetResponse setLostMode(String ownerPrincipal, Long petId, LostModeRequest request);
    PetResponse setPhoto(String ownerPrincipal, Long petId, MultipartFile file);
}
