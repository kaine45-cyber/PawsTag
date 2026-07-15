package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Owner;

import java.util.Optional;

public interface OwnerRepository extends JpaRepository<Owner, Long> {
    Optional<Owner> findByEmail(String email);
    boolean existsByEmail(String email);

    /** Định danh chính khi login Google (theo Google sub lưu ở google_id). */
    Optional<Owner> findByGoogleId(String googleId);
}
