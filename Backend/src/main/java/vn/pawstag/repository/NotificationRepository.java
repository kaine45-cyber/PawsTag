package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pawstag.entity.Notification;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Notification> findByIdAndOwnerId(Long id, Long ownerId);

    long countByOwnerIdAndReadFalse(Long ownerId);

    @Modifying
    @Query("update Notification n set n.read = true where n.owner.id = :ownerId and n.read = false")
    int markAllRead(@Param("ownerId") Long ownerId);

    long deleteByOwnerId(Long ownerId);
}
