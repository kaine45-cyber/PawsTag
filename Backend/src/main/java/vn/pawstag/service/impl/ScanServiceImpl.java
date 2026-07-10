package vn.pawstag.service.impl;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.ScanRequest;
import vn.pawstag.event.ScanRecordedEvent;
import vn.pawstag.dto.response.PublicPetResponse;
import vn.pawstag.dto.response.PublicScanResponse;
import vn.pawstag.dto.response.ScanLogResponse;
import vn.pawstag.dto.response.ScanResultResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.ScanLog;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.NotificationType;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.mapper.PetMapper;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.ScanLogRepository;
import vn.pawstag.repository.TagRepository;
import vn.pawstag.service.NotificationService;
import vn.pawstag.service.ScanService;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ScanServiceImpl implements ScanService {

    private final TagRepository tagRepository;
    private final ScanLogRepository scanLogRepository;
    private final OwnerRepository ownerRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final PetMapper petMapper;

    public ScanServiceImpl(TagRepository tagRepository,
                           ScanLogRepository scanLogRepository,
                           OwnerRepository ownerRepository,
                           NotificationService notificationService,
                           ApplicationEventPublisher eventPublisher,
                           PetMapper petMapper) {
        this.tagRepository = tagRepository;
        this.scanLogRepository = scanLogRepository;
        this.ownerRepository = ownerRepository;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
        this.petMapper = petMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PublicScanResponse lookup(String publicCode) {
        Tag tag = tagRepository.findByPublicCode(normalize(publicCode)).orElse(null);
        if (tag == null) {
            return PublicScanResponse.notFound();
        }
        if (tag.getStatus() != TagStatus.ACTIVE || tag.getPet() == null) {
            return PublicScanResponse.unassigned();
        }
        return PublicScanResponse.active(toPublic(tag.getPet(), tag.getPublicCode()));
    }

    @Override
    @Transactional
    public ScanResultResponse record(ScanRequest request) {
        Tag tag = tagRepository.findByPublicCode(normalize(request.publicCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Tag code not found"));

        // Lưu scan NGAY, chưa có locationName — reverse-geocode (HTTP, có thể mất vài giây)
        // chạy nền sau khi transaction này commit, tránh giữ connection DB chờ Nominatim.
        ScanLog log = ScanLog.builder()
                .tag(tag)
                .latitude(request.lat())
                .longitude(request.lng())
                .userAgent(request.userAgent())
                .deviceType(detectDevice(request.userAgent()))
                .build();
        ScanLog saved = scanLogRepository.save(log);
        eventPublisher.publishEvent(new ScanRecordedEvent(saved.getId(), request.lat(), request.lng()));

        // Thông báo cho owner khi pet bị quét.
        Pet pet = tag.getPet();
        if (pet != null && pet.getOwner() != null) {
            boolean hasLocation = request.lat() != null && request.lng() != null;
            boolean found = Boolean.TRUE.equals(request.found());
            if (found) {
                notificationService.create(pet.getOwner(), pet, NotificationType.ALERT,
                        "🎉 " + pet.getName() + " may have been found!",
                        "Someone reported finding " + pet.getName()
                                + (hasLocation ? " and shared their location." : "."));
            } else if (hasLocation) {
                notificationService.create(pet.getOwner(), pet, NotificationType.LOCATION,
                        "Location shared",
                        "A finder shared their location for " + pet.getName() + ".");
            } else {
                notificationService.create(pet.getOwner(), pet, NotificationType.SCAN,
                        pet.getName() + " was scanned!",
                        "Someone scanned " + pet.getName() + "'s tag.");
            }
        }

        return new ScanResultResponse(String.valueOf(saved.getId()),
                saved.getScannedAt().toString());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScanLogResponse> history(String ownerEmail, Long petId) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        List<ScanLog> logs = (petId != null)
                ? scanLogRepository.findByTag_Pet_IdAndTag_Pet_Owner_IdOrderByScannedAtDesc(petId, owner.getId())
                : scanLogRepository.findByTag_Pet_Owner_IdOrderByScannedAtDesc(owner.getId());
        return logs.stream().map(ScanLogResponse::from).toList();
    }

    // ── lọc privacy ở SERVER ──
    private PublicPetResponse toPublic(Pet p, String tagCode) {
        String phone = p.isShowPhone() ? p.getContactPhone() : null;
        String ownerName = p.isShowOwnerName() && p.getOwner() != null
                ? p.getOwner().getFullName() : null;

        return new PublicPetResponse(
                p.getName(),
                p.getType(),
                p.getBreed(),
                petMapper.ageMonthsOf(p),
                p.getGender(),
                petMapper.weightOf(p),
                p.getColor(),
                p.getPhotoUrl(),
                p.isLost() ? "lost" : "safe",
                p.getEmergencyMessage(),
                phone,
                ownerName,
                p.isVaccinated(),
                p.getCollar(),
                p.getIdentificationNotes(),
                new PublicPetResponse.Medical(
                        p.getAllergies(),
                        p.getConditions(),
                        p.getMedications(),
                        p.getBloodType(),
                        p.getMicrochipId(),
                        p.getLastVetVisit() != null ? p.getLastVetVisit().toString() : null,
                        p.getVetName()
                ),
                p.isLost() ? p.getLostMessage() : null,
                p.isLost() ? p.getRewardAmount() : (BigDecimal) null,
                tagCode
        );
    }

    private String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }

    private String detectDevice(String userAgent) {
        if (userAgent == null) return null;
        return userAgent.toLowerCase().contains("mobi") ? "mobile" : "desktop";
    }
}
