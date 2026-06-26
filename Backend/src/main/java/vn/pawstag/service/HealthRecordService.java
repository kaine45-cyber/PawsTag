package vn.pawstag.service;

import vn.pawstag.dto.request.VaccinationRequest;
import vn.pawstag.dto.request.VetVisitRequest;

public interface HealthRecordService {
    void addVaccination(String ownerEmail, Long petId, VaccinationRequest req);
    void deleteVaccination(String ownerEmail, Long petId, Long vaccinationId);
    void addVetVisit(String ownerEmail, Long petId, VetVisitRequest req);
    void deleteVetVisit(String ownerEmail, Long petId, Long visitId);
}
