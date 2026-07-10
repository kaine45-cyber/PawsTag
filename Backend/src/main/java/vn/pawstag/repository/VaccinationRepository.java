package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pawstag.entity.Vaccination;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {
    List<Vaccination> findByPetIdOrderByGivenDateDesc(Long petId);
    Optional<Vaccination> findByIdAndPet_Id(Long id, Long petId);

    /** Mũi tiêm có hạn trong [min, max] — fetch sẵn pet + owner cho job nhắc lịch. */
    @Query("select v from Vaccination v join fetch v.pet p join fetch p.owner where v.dueDate between :min and :max")
    List<Vaccination> findDueBetween(@Param("min") LocalDate min, @Param("max") LocalDate max);
}
