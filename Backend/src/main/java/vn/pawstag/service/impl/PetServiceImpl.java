package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.LostModeRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.response.PetResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.mapper.PetMapper;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.service.PetService;
import vn.pawstag.service.StorageService;
import vn.pawstag.service.TagService;

import java.time.Instant;
import java.util.List;

@Service
public class PetServiceImpl implements PetService {

    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final PetMapper petMapper;
    private final TagService tagService;
    private final StorageService storageService;

    public PetServiceImpl(PetRepository petRepository,
                          OwnerRepository ownerRepository,
                          PetMapper petMapper,
                          TagService tagService,
                          StorageService storageService) {
        this.petRepository = petRepository;
        this.ownerRepository = ownerRepository;
        this.petMapper = petMapper;
        this.tagService = tagService;
        this.storageService = storageService;
    }

    @Override
    @Transactional
    public PetResponse create(String ownerPrincipal, PetRequest request) {
        // Mô hình "QR in trước, kích hoạt sau": pet PHẢI kèm mã QR (public_code) của thẻ vật lý.
        // KHÔNG tự sinh mã mới. Validate ở đây vì PetRequest dùng chung cho create + update.
        String publicCode = request.publicCode();
        if (publicCode == null || publicCode.isBlank()) {
            throw new BadRequestException("Mã QR (publicCode) là bắt buộc khi tạo thú cưng");
        }

        Owner owner = requireOwner(ownerPrincipal);
        Pet pet = new Pet();
        pet.setOwner(owner);
        petMapper.apply(pet, request);
        Pet saved = petRepository.save(pet);

        // Gắn tag đã in sẵn (UNASSIGNED) vào pet — cùng transaction: nếu mã lỗi thì
        // toàn bộ (kể cả việc lưu pet) rollback, không tạo pet "mồ côi" không có thẻ.
        tagService.assignExistingTagToPet(publicCode, saved);
        return petMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PetResponse> list(String ownerPrincipal) {
        Owner owner = requireOwner(ownerPrincipal);
        return petMapper.toResponseBatch(petRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public PetResponse get(String ownerPrincipal, Long petId) {
        return petMapper.toResponse(requirePet(ownerPrincipal, petId));
    }

    @Override
    @Transactional
    public PetResponse update(String ownerPrincipal, Long petId, PetRequest request) {
        Pet pet = requirePet(ownerPrincipal, petId);
        petMapper.apply(pet, request);
        return petMapper.toResponse(petRepository.save(pet));
    }

    @Override
    @Transactional
    public void delete(String ownerPrincipal, Long petId) {
        Pet pet = requirePet(ownerPrincipal, petId);
        // Thu hồi tag về UNASSIGNED (gỡ pet_id) để tránh vướng FK khi xoá pet.
        // RỦI RO LỊCH SỬ: scan_logs vẫn trỏ tới tag này. Khi tag được kích hoạt lại
        // cho pet khác, lịch sử quét cũ sẽ lẫn giữa 2 pet. Chưa xử lý — giữ logic hiện tại
        // theo yêu cầu; nếu cần bảo toàn lịch sử, nên archive tag (thêm status RETIRED)
        // thay vì trả về UNASSIGNED để tái sử dụng.
        tagService.releaseTagsForPet(pet);
        petRepository.delete(pet);
    }

    @Override
    @Transactional
    public PetResponse setPhoto(String ownerPrincipal, Long petId, MultipartFile file) {
        Pet pet = requirePet(ownerPrincipal, petId);
        String url = storageService.store(file, "pets");
        pet.setPhotoUrl(url);
        return petMapper.toResponse(petRepository.save(pet));
    }

    @Override
    @Transactional
    public PetResponse setLostMode(String ownerPrincipal, Long petId, LostModeRequest request) {
        Pet pet = requirePet(ownerPrincipal, petId);
        boolean nowLost = Boolean.TRUE.equals(request.isLost());
        pet.setLost(nowLost);
        pet.setLostMessage(request.lostMessage());
        pet.setRewardAmount(request.rewardAmount());
        if (request.alertRadiusKm() != null) pet.setAlertRadiusKm(request.alertRadiusKm());
        pet.setLostSince(nowLost ? Instant.now() : null);
        return petMapper.toResponse(petRepository.save(pet));
    }

    // ── helpers ──
    private Owner requireOwner(String principal) {
        return ownerRepository.findByPrincipal(principal)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }

    private Pet requirePet(String ownerPrincipal, Long petId) {
        Owner owner = requireOwner(ownerPrincipal);
        return petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found"));
    }
}
