package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.LostModeRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.response.PetResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
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
    public PetResponse create(String ownerEmail, PetRequest request) {
        Owner owner = requireOwner(ownerEmail);
        Pet pet = new Pet();
        pet.setOwner(owner);
        petMapper.apply(pet, request);
        Pet saved = petRepository.save(pet);
        tagService.createForPet(saved);          // auto sinh 1 tag ACTIVE (digital-first)
        return petMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PetResponse> list(String ownerEmail) {
        Owner owner = requireOwner(ownerEmail);
        return petRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream().map(petMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PetResponse get(String ownerEmail, Long petId) {
        return petMapper.toResponse(requirePet(ownerEmail, petId));
    }

    @Override
    @Transactional
    public PetResponse update(String ownerEmail, Long petId, PetRequest request) {
        Pet pet = requirePet(ownerEmail, petId);
        petMapper.apply(pet, request);
        return petMapper.toResponse(petRepository.save(pet));
    }

    @Override
    @Transactional
    public void delete(String ownerEmail, Long petId) {
        Pet pet = requirePet(ownerEmail, petId);
        tagService.releaseTagsForPet(pet);       // thu hồi tag (UNASSIGNED) tránh vướng FK
        petRepository.delete(pet);
    }

    @Override
    @Transactional
    public PetResponse setPhoto(String ownerEmail, Long petId, MultipartFile file) {
        Pet pet = requirePet(ownerEmail, petId);
        String url = storageService.store(file, "pets");
        pet.setPhotoUrl(url);
        return petMapper.toResponse(petRepository.save(pet));
    }

    @Override
    @Transactional
    public PetResponse setLostMode(String ownerEmail, Long petId, LostModeRequest request) {
        Pet pet = requirePet(ownerEmail, petId);
        boolean nowLost = Boolean.TRUE.equals(request.isLost());
        pet.setLost(nowLost);
        pet.setLostMessage(request.lostMessage());
        pet.setRewardAmount(request.rewardAmount());
        if (request.alertRadiusKm() != null) pet.setAlertRadiusKm(request.alertRadiusKm());
        pet.setLostSince(nowLost ? Instant.now() : null);
        return petMapper.toResponse(petRepository.save(pet));
    }

    // ── helpers ──
    private Owner requireOwner(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }

    private Pet requirePet(String ownerEmail, Long petId) {
        Owner owner = requireOwner(ownerEmail);
        return petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found"));
    }
}
