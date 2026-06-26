package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.TagStatus;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    boolean existsByPublicCode(String publicCode);

    Optional<Tag> findByPublicCode(String publicCode);

    Optional<Tag> findFirstByPetIdAndStatus(Long petId, TagStatus status);

    List<Tag> findByPetId(Long petId);

    List<Tag> findByPet_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    long countByPet_Owner_IdAndStatus(Long ownerId, TagStatus status);

    Optional<Tag> findByIdAndPet_Owner_Id(Long id, Long ownerId);
}
