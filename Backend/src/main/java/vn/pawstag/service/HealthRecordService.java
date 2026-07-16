package vn.pawstag.service;

import vn.pawstag.dto.request.VaccinationRequest;
import vn.pawstag.dto.request.VetVisitRequest;

public interface HealthRecordService {
    void addVaccination(String ownerPrincipal, Long petId, VaccinationRequest req);
    void deleteVaccination(String ownerPrincipal, Long petId, Long vaccinationId);
    void addVetVisit(String ownerPrincipal, Long petId, VetVisitRequest req);
    void deleteVetVisit(String ownerPrincipal, Long petId, Long visitId);
}
