package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Pet;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<Pet> findByIdAndOwnerId(Long id, Long ownerId);
    long countByOwnerId(Long ownerId);
    long countByOwnerIdAndLostTrue(Long ownerId);
}
