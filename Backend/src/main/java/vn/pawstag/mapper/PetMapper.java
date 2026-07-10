package vn.pawstag.mapper;

import org.springframework.stereotype.Component;
import vn.pawstag.dto.request.EmergencyContactRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.response.EmergencyContactResponse;
import vn.pawstag.dto.response.PetResponse;
import vn.pawstag.entity.EmergencyContact;
import vn.pawstag.entity.Pet;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.repository.ScanLogRepository;
import vn.pawstag.repository.TagRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Chuyển đổi Pet entity ↔ DTO. Tính các field "tính ra":
 * age (từ birthDate), tagCode (join tags), scansToday/totalScans (count scan_logs).
 */
@Component
public class PetMapper {

    private final TagRepository tagRepository;
    private final ScanLogRepository scanLogRepository;

    public PetMapper(TagRepository tagRepository, ScanLogRepository scanLogRepository) {
        this.tagRepository = tagRepository;
        this.scanLogRepository = scanLogRepository;
    }

    /**
     * Áp dữ liệu request lên entity (create + update) theo PATCH semantics:
     * chỉ cập nhật field có giá trị (non-null) → tránh xoá dữ liệu khi Edit gửi thiếu field.
     * Mặc định privacy (show*) lấy từ entity (true ở pet mới).
     */
    public void apply(Pet pet, PetRequest r) {
        if (r.name() != null) pet.setName(r.name());
        if (r.species() != null) pet.setType(r.species());
        if (r.breed() != null) pet.setBreed(r.breed());
        if (r.color() != null) pet.setColor(r.color());
        if (r.birthDate() != null) pet.setBirthDate(r.birthDate());
        if (r.weight() != null) pet.setWeight(r.weight());
        if (r.gender() != null) pet.setGender(r.gender());
        if (r.collar() != null) pet.setCollar(r.collar());
        if (r.contactPhone() != null) pet.setContactPhone(r.contactPhone());

        if (r.vaccinated() != null) pet.setVaccinated(r.vaccinated());
        if (r.bloodType() != null) pet.setBloodType(r.bloodType());
        if (r.microchipId() != null) pet.setMicrochipId(r.microchipId());
        if (r.allergies() != null) pet.setAllergies(r.allergies());
        if (r.conditions() != null) pet.setConditions(r.conditions());
        if (r.medications() != null) pet.setMedications(r.medications());
        if (r.lastVetVisit() != null) pet.setLastVetVisit(r.lastVetVisit());
        if (r.vetName() != null) pet.setVetName(r.vetName());
        if (r.vetPhone() != null) pet.setVetPhone(r.vetPhone());
        if (r.medicalInfo() != null) pet.setMedicalInfo(r.medicalInfo());
        if (r.identificationNotes() != null) pet.setIdentificationNotes(r.identificationNotes());
        if (r.emergencyMessage() != null) pet.setEmergencyMessage(r.emergencyMessage());
        if (r.photoUrl() != null) pet.setPhotoUrl(r.photoUrl());

        if (r.showPhone() != null) pet.setShowPhone(r.showPhone());
        if (r.showOwnerName() != null) pet.setShowOwnerName(r.showOwnerName());
        if (r.showLocation() != null) pet.setShowLocation(r.showLocation());

        // emergency contacts: chỉ thay khi request có gửi (non-null); [] = xoá hết
        List<EmergencyContactRequest> contacts = r.emergencyContacts();
        if (contacts != null) {
            pet.clearEmergencyContacts();
            for (EmergencyContactRequest c : contacts) {
                pet.addEmergencyContact(EmergencyContact.builder()
                        .name(c.name())
                        .phone(c.phone())
                        .relationship(c.relationship())
                        .priority(c.priority() == null ? 1 : c.priority())
                        .build());
            }
        }
    }

    /** Dùng cho 1 pet đơn lẻ (get/create/update/...). Nội bộ gọi lại toResponseBatch với danh sách 1 phần tử. */
    public PetResponse toResponse(Pet p) {
        return toResponseBatch(List.of(p)).get(0);
    }

    /**
     * Dựng PetResponse cho NHIỀU pet cùng lúc bằng 3 query gộp (thay vì 3 query/pet).
     * Dùng cho /pet (list) và /dashboard — tránh N+1 khi owner có nhiều pet.
     */
    public List<PetResponse> toResponseBatch(List<Pet> pets) {
        if (pets.isEmpty()) return List.of();

        List<Long> ids = pets.stream().map(Pet::getId).filter(Objects::nonNull).toList();

        Map<Long, String> tagCodes = ids.isEmpty() ? Collections.emptyMap()
                : tagRepository.findActiveCodesByPetIds(ids, TagStatus.ACTIVE).stream()
                        .collect(Collectors.toMap(TagRepository.PetTagCode::getPetId, TagRepository.PetTagCode::getPublicCode));

        Map<Long, Long> totalScans = ids.isEmpty() ? Collections.emptyMap()
                : scanLogRepository.countTotalByPetIds(ids).stream()
                        .collect(Collectors.toMap(ScanLogRepository.PetScanCount::getPetId, ScanLogRepository.PetScanCount::getCnt));

        Map<Long, Long> scansToday = ids.isEmpty() ? Collections.emptyMap()
                : scanLogRepository.countTodayByPetIds(ids, startOfToday()).stream()
                        .collect(Collectors.toMap(ScanLogRepository.PetScanCount::getPetId, ScanLogRepository.PetScanCount::getCnt));

        return pets.stream()
                .map(p -> buildResponse(p,
                        tagCodes.get(p.getId()),
                        totalScans.getOrDefault(p.getId(), 0L).intValue(),
                        scansToday.getOrDefault(p.getId(), 0L).intValue()))
                .toList();
    }

    private PetResponse buildResponse(Pet p, String tagCode, int totalScans, int scansToday) {
        return new PetResponse(
                String.valueOf(p.getId()),
                String.valueOf(p.getOwner().getId()),
                p.getName(),
                p.getType(),
                p.getBreed(),
                p.getGender(),
                p.getBirthDate() != null ? p.getBirthDate().toString() : null,
                computeAgeMonths(p.getBirthDate()),
                formatWeight(p.getWeight()),
                p.getColor(),
                p.getCollar(),
                p.getIdentificationNotes(),
                p.getPhotoUrl(),
                p.isLost() ? "lost" : "safe",
                tagCode,                               // join tag ACTIVE của pet
                p.getContactPhone(),
                p.getEmergencyMessage(),
                scansToday,
                totalScans,
                new PetResponse.Medical(
                        p.getAllergies(),
                        p.getConditions(),
                        p.getMedications(),
                        p.getBloodType(),
                        p.getMicrochipId(),
                        p.getLastVetVisit() != null ? p.getLastVetVisit().toString() : null,
                        p.getVetName(),
                        p.getVetPhone()
                ),
                p.getLostMessage(),
                p.getRewardAmount(),
                p.getAlertRadiusKm(),
                p.getEmergencyContacts().stream().map(EmergencyContactResponse::from).toList()
        );
    }

    /** Public helper dùng lại cho PublicPetResponse/Passport. Tổng số tháng tuổi (locale-neutral). */
    public Integer ageMonthsOf(Pet p) {
        return computeAgeMonths(p.getBirthDate());
    }

    public String weightOf(Pet p) {
        return formatWeight(p.getWeight());
    }

    /** Tổng số tháng tuổi tính từ birthDate — null nếu chưa có / ngày sinh trong tương lai.
     *  Không kèm chữ tiếng Anh: frontend tự format sang chuỗi hiển thị theo ngôn ngữ. */
    private Integer computeAgeMonths(LocalDate birthDate) {
        if (birthDate == null) return null;
        Period p = Period.between(birthDate, LocalDate.now());
        if (p.isNegative()) return null;
        return p.getYears() * 12 + p.getMonths();
    }

    /** "12.5" / "25" — bỏ số 0 thừa. */
    private String formatWeight(BigDecimal w) {
        if (w == null) return null;
        return w.stripTrailingZeros().toPlainString();
    }

    private java.time.Instant startOfToday() {
        return LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
    }
}
