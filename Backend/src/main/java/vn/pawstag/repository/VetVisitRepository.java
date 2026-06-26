package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.VetVisit;

import java.util.List;
import java.util.Optional;

public interface VetVisitRepository extends JpaRepository<VetVisit, Long> {
    List<VetVisit> findByPetIdOrderByVisitDateDesc(Long petId);
    Optional<VetVisit> findByIdAndPet_Id(Long id, Long petId);
}
