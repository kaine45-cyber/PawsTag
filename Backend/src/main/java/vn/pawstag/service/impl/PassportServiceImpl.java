package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.response.PassportResponse;
import vn.pawstag.dto.response.PassportResponse.*;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Vaccination;
import vn.pawstag.entity.VetVisit;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.mapper.PetMapper;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.repository.VaccinationRepository;
import vn.pawstag.repository.VetVisitRepository;
import vn.pawstag.service.PassportService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PassportServiceImpl implements PassportService {

    private static final DateTimeFormatter LONG = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MON  = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private static final Map<String, String> SCI = Map.of(
            "dog", "Canis lupus familiaris",
            "cat", "Felis catus",
            "rabbit", "Oryctolagus cuniculus",
            "bird", "Aves"
    );

    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final VaccinationRepository vaccinationRepository;
    private final VetVisitRepository vetVisitRepository;
    private final PetMapper petMapper;

    public PassportServiceImpl(PetRepository petRepository, OwnerRepository ownerRepository,
                               VaccinationRepository vaccinationRepository, VetVisitRepository vetVisitRepository,
                               PetMapper petMapper) {
        this.petRepository = petRepository;
        this.ownerRepository = ownerRepository;
        this.vaccinationRepository = vaccinationRepository;
        this.vetVisitRepository = vetVisitRepository;
        this.petMapper = petMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PassportResponse getPassport(String ownerEmail, Long petId) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        Pet p = petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found"));

        List<Vaccination> vaccs = vaccinationRepository.findByPetIdOrderByGivenDateDesc(petId);
        List<VetVisit> visits = vetVisitRepository.findByPetIdOrderByVisitDateDesc(petId);

        LocalDate today = LocalDate.now();

        // ── vaccinations ──
        List<VaccinationItem> vaccItems = new ArrayList<>();
        int valid = 0;
        for (Vaccination v : vaccs) {
            String status = vaccStatus(v.getDueDate(), today);
            if ("Valid".equals(status)) valid++;
            vaccItems.add(new VaccinationItem(
                    String.valueOf(v.getId()),
                    v.getName(),
                    v.getGivenDate() != null ? v.getGivenDate().format(LONG) : "—",
                    v.getDueDate() != null ? v.getDueDate().format(LONG) : "—",
                    status));
        }

        // ── vet visits ──
        List<VetVisitItem> visitItems = visits.stream()
                .map(v -> new VetVisitItem(String.valueOf(v.getId()), v.getVetName(), v.getClinic(), v.getNote(),
                        v.getVisitDate() != null ? v.getVisitDate().format(LONG) : "—"))
                .toList();
        int visitsThisYear = (int) visits.stream()
                .filter(v -> v.getVisitDate() != null && v.getVisitDate().getYear() == today.getYear())
                .count();

        int healthScore = computeHealthScore(vaccs.size(), valid, p);

        Health health = new Health(valid, vaccs.size(), visitsThisYear, healthScore);

        // ── identity ──
        String pawstagId = "PT-2025-" + p.getName().toUpperCase() + "-001";
        Identity identity = new Identity(
                p.getName(),
                SCI.getOrDefault(p.getType(), p.getType()),
                p.getBreed(),
                p.getBirthDate() != null ? p.getBirthDate().format(LONG) : "—",
                petMapper.ageOf(p) != null ? petMapper.ageOf(p) : "—",
                p.getWeight() != null ? petMapper.weightOf(p) + " kg" : "—",
                p.getColor(),
                p.getEyeColor()
        );

        Microchip microchip = new Microchip(
                p.getMicrochipId() != null ? groupDigits(p.getMicrochipId()) : null,
                p.getImplantDate() != null ? p.getImplantDate().format(LONG) : null,
                p.getImplantLocation(),
                pawstagId);

        var ownerDto = new PassportResponse.Owner(
                owner.getFullName(), owner.getPhone(), owner.getCity(), owner.getAvatarUrl());

        MedicalNotes medical = new MedicalNotes(
                p.getBloodType(),
                idealWeight(p),
                p.getAllergies() != null ? p.getAllergies() : "None known",
                p.getMedications() != null ? p.getMedications() : "None",
                p.isNeutered() ? "Yes" + (p.getNeuteredDate() != null ? " (" + p.getNeuteredDate().format(MON) + ")" : "") : "No",
                p.getDiet());

        List<TravelItem> travel = buildTravel(vaccs, p, today);

        String mrz = ("PET<<" + p.getName() + "<<" + nz(p.getBreed()).replace(" ", "") + "<<<<<<<<<<<<<<")
                .toUpperCase().replace("<<<<<<<<<<<<<<<<<<<<<<<", "<<<<<<<<<<");

        String passportNo = String.format("PT-2025-VN-%05d", p.getId());
        String issued = p.getCreatedAt() != null
                ? p.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).format(MON) : "—";

        return new PassportResponse(
                String.valueOf(p.getId()), p.getName(), p.getBreed(), p.getPhotoUrl(),
                passportNo, issued, pawstagId, mrz,
                identity, microchip, ownerDto, health,
                vaccItems, visitItems, medical, travel);
    }

    private String vaccStatus(LocalDate due, LocalDate today) {
        if (due == null) return "Valid";
        if (due.isBefore(today)) return "Expired";
        if (due.isBefore(today.plusDays(45))) return "Expiring";
        return "Valid";
    }

    private int computeHealthScore(int total, int valid, Pet p) {
        int score = 70;
        if (total > 0) score += (int) Math.round((valid * 25.0) / total);
        if (p.isVaccinated()) score += 3;
        if (p.getMicrochipId() != null) score += 2;
        return Math.min(score, 100);
    }

    private String idealWeight(Pet p) {
        if (p.getWeight() == null) return "—";
        double w = p.getWeight().doubleValue();
        return Math.round(w - 1.5) + "–" + Math.round(w + 1.5) + " kg";
    }

    private List<TravelItem> buildTravel(List<Vaccination> vaccs, Pet p, LocalDate today) {
        List<TravelItem> list = new ArrayList<>();
        Vaccination rabies = vaccs.stream().filter(v -> v.getName().toLowerCase().contains("rabies")).findFirst().orElse(null);
        list.add(new TravelItem("Rabies vaccination",
                rabies != null && rabies.getDueDate() != null ? "Valid until " + rabies.getDueDate().format(MON) : "Not recorded",
                rabies != null && (rabies.getDueDate() == null || rabies.getDueDate().isAfter(today)) ? "ok" : "warn"));
        list.add(new TravelItem("Microchip ISO 11784",
                p.getMicrochipId() != null ? "#" + groupDigits(p.getMicrochipId()) : "Missing",
                p.getMicrochipId() != null ? "ok" : "warn"));
        list.add(new TravelItem("Health certificate",
                p.getLastVetVisit() != null ? "Issued " + p.getLastVetVisit().format(MON) : "Not issued",
                p.getLastVetVisit() != null ? "ok" : "warn"));
        list.add(new TravelItem("Tapeworm treatment", "Required for some countries", "warn"));
        boolean parasite = vaccs.stream().anyMatch(v -> v.getName().toLowerCase().contains("parasite")
                || (p.getMedications() != null && p.getMedications().toLowerCase().contains("flea")));
        list.add(new TravelItem("Parasite treatment",
                parasite ? "Treatment on record" : "Not recorded", parasite ? "ok" : "warn"));
        return list;
    }

    private String groupDigits(String s) {
        return s.replaceAll("(\\d{3})(?=\\d)", "$1 ");
    }

    private String nz(String s) { return s == null ? "" : s; }
}
