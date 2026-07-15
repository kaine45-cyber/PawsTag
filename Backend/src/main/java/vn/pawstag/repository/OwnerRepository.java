package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.Owner;

import java.util.Optional;

public interface OwnerRepository extends JpaRepository<Owner, Long> {
    Optional<Owner> findByEmail(String email);
    boolean existsByEmail(String email);

    /** Định danh chính khi login Google (theo Google sub lưu ở google_id). */
    Optional<Owner> findByGoogleId(String googleId);

    /**
     * Tra cứu owner theo principal của security context (= owner id dạng chuỗi, từ JWT subject).
     * Principal không phải số (token hỏng) → empty, không throw.
     */
    default Optional<Owner> findByPrincipal(String principal) {
        try {
            return findById(Long.parseLong(principal));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
