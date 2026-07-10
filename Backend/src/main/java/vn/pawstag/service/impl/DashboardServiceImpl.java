package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.response.DashboardResponse;
import vn.pawstag.dto.response.PetResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.mapper.PetMapper;
import vn.pawstag.entity.ScanLog;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.repository.NotificationRepository;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.repository.ScanLogRepository;
import vn.pawstag.repository.TagRepository;
import vn.pawstag.service.DashboardService;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final TagRepository tagRepository;
    private final ScanLogRepository scanLogRepository;
    private final NotificationRepository notificationRepository;
    private final PetMapper petMapper;

    public DashboardServiceImpl(PetRepository petRepository,
                                OwnerRepository ownerRepository,
                                TagRepository tagRepository,
                                ScanLogRepository scanLogRepository,
                                NotificationRepository notificationRepository,
                                PetMapper petMapper) {
        this.petRepository = petRepository;
        this.ownerRepository = ownerRepository;
        this.tagRepository = tagRepository;
        this.scanLogRepository = scanLogRepository;
        this.notificationRepository = notificationRepository;
        this.petMapper = petMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String ownerEmail) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        List<Pet> pets = petRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId());
        List<PetResponse> petDtos = petMapper.toResponseBatch(pets);

        long totalPets = pets.size();
        long lostActive = pets.stream().filter(Pet::isLost).count();
        long activeTags = tagRepository.countByPet_Owner_IdAndStatus(owner.getId(), TagStatus.ACTIVE);

        Instant startOfToday = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        long scansToday = scanLogRepository.countByTag_Pet_Owner_IdAndScannedAtAfter(owner.getId(), startOfToday);
        long totalScans = scanLogRepository.countByTag_Pet_Owner_Id(owner.getId());
        long unread = notificationRepository.countByOwnerIdAndReadFalse(owner.getId());

        List<DashboardResponse.RecentScan> recent = scanLogRepository
                .findTop3ByTag_Pet_Owner_IdOrderByScannedAtDesc(owner.getId())
                .stream().map(this::toRecent).toList();

        DashboardResponse.Stats stats = new DashboardResponse.Stats(
                totalPets, activeTags, scansToday, totalScans, lostActive, unread);

        return new DashboardResponse(stats, petDtos, recent);
    }

    private DashboardResponse.RecentScan toRecent(ScanLog s) {
        Pet pet = s.getTag().getPet();
        return new DashboardResponse.RecentScan(
                pet != null ? pet.getName() : "Unknown",
                pet != null ? pet.getPhotoUrl() : null,
                s.getLocationName() != null ? s.getLocationName() : "Unknown location",
                vn.pawstag.util.TimeUtil.relative(s.getScannedAt())   // "10 min ago"
        );
    }
}
