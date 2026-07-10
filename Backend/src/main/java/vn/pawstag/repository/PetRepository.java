package vn.pawstag.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Pet;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {

    // @EntityGraph nạp sẵn emergencyContacts trong 1 query (JOIN) — tránh N+1 khi
    // PetMapper lặp qua p.getEmergencyContacts() cho từng pet trong danh sách.
    @EntityGraph(attributePaths = "emergencyContacts")
    List<Pet> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Pet> findByIdAndOwnerId(Long id, Long ownerId);
    long countByOwnerId(Long ownerId);
    long countByOwnerIdAndLostTrue(Long ownerId);
}
