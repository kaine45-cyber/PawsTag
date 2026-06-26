package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Vaccination;

import java.util.List;
import java.util.Optional;

public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {
    List<Vaccination> findByPetIdOrderByGivenDateDesc(Long petId);
    Optional<Vaccination> findByIdAndPet_Id(Long id, Long petId);
}
