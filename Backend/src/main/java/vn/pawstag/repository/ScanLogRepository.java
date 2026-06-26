package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.ScanLog;

import java.time.Instant;
import java.util.List;

public interface ScanLogRepository extends JpaRepository<ScanLog, Long> {

    // ── theo pet (cho PetResponse) ──
    long countByTag_Pet_Id(Long petId);
    long countByTag_Pet_IdAndScannedAtAfter(Long petId, Instant after);

    // ── theo owner (cho dashboard) ──
    long countByTag_Pet_Owner_Id(Long ownerId);
    long countByTag_Pet_Owner_IdAndScannedAtAfter(Long ownerId, Instant after);
    List<ScanLog> findTop3ByTag_Pet_Owner_IdOrderByScannedAtDesc(Long ownerId);

    // ── lịch sử (Phase 5) — luôn scope theo owner ──
    List<ScanLog> findByTag_Pet_Owner_IdOrderByScannedAtDesc(Long ownerId);
    List<ScanLog> findByTag_Pet_IdAndTag_Pet_Owner_IdOrderByScannedAtDesc(Long petId, Long ownerId);
}
