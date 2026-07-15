package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.VaccinationRequest;
import vn.pawstag.dto.request.VetVisitRequest;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Vaccination;
import vn.pawstag.entity.VetVisit;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.repository.VaccinationRepository;
import vn.pawstag.repository.VetVisitRepository;
import vn.pawstag.service.HealthRecordService;

@Service
public class HealthRecordServiceImpl implements HealthRecordService {

    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final VaccinationRepository vaccinationRepository;
    private final VetVisitRepository vetVisitRepository;

    public HealthRecordServiceImpl(PetRepository petRepository, OwnerRepository ownerRepository,
                                   VaccinationRepository vaccinationRepository, VetVisitRepository vetVisitRepository) {
        this.petRepository = petRepository;
        this.ownerRepository = ownerRepository;
        this.vaccinationRepository = vaccinationRepository;
        this.vetVisitRepository = vetVisitRepository;
    }

    @Override
    @Transactional
    public void addVaccination(String ownerPrincipal, Long petId, VaccinationRequest req) {
        Pet pet = requirePet(ownerPrincipal, petId);
        vaccinationRepository.save(Vaccination.builder()
                .pet(pet).name(req.name()).givenDate(req.givenDate()).dueDate(req.dueDate()).build());
    }

    @Override
    @Transactional
    public void deleteVaccination(String ownerPrincipal, Long petId, Long vaccinationId) {
        requirePet(ownerPrincipal, petId);
        Vaccination v = vaccinationRepository.findByIdAndPet_Id(vaccinationId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination not found"));
        vaccinationRepository.delete(v);
    }

    @Override
    @Transactional
    public void addVetVisit(String ownerPrincipal, Long petId, VetVisitRequest req) {
        Pet pet = requirePet(ownerPrincipal, petId);
        vetVisitRepository.save(VetVisit.builder()
                .pet(pet).vetName(req.vetName()).clinic(req.clinic()).note(req.note()).visitDate(req.visitDate()).build());
    }

    @Override
    @Transactional
    public void deleteVetVisit(String ownerPrincipal, Long petId, Long visitId) {
        requirePet(ownerPrincipal, petId);
        VetVisit v = vetVisitRepository.findByIdAndPet_Id(visitId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Vet visit not found"));
        vetVisitRepository.delete(v);
    }

    private Pet requirePet(String ownerPrincipal, Long petId) {
        Owner owner = ownerRepository.findByPrincipal(ownerPrincipal)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        return petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found"));
    }
}
