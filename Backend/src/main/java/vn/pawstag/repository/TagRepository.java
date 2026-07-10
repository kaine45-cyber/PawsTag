package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.TagStatus;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    boolean existsByPublicCode(String publicCode);

    Optional<Tag> findByPublicCode(String publicCode);

    Optional<Tag> findFirstByPetIdAndStatus(Long petId, TagStatus status);

    /** Projection dùng cho query gộp theo nhiều pet (tránh N+1 khi liệt kê pet). */
    interface PetTagCode {
        Long getPetId();
        String getPublicCode();
    }

    @Query("SELECT t.pet.id AS petId, t.publicCode AS publicCode FROM Tag t " +
           "WHERE t.pet.id IN :petIds AND t.status = :status")
    List<PetTagCode> findActiveCodesByPetIds(@Param("petIds") List<Long> petIds, @Param("status") TagStatus status);

    List<Tag> findByPetId(Long petId);

    List<Tag> findByPet_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    long countByPet_Owner_IdAndStatus(Long ownerId, TagStatus status);

    Optional<Tag> findByIdAndPet_Owner_Id(Long id, Long ownerId);
}
