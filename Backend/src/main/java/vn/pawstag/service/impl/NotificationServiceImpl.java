package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.response.NotificationResponse;
import vn.pawstag.entity.Notification;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.enums.NotificationType;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.repository.NotificationRepository;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.service.NotificationService;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final OwnerRepository ownerRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   OwnerRepository ownerRepository) {
        this.notificationRepository = notificationRepository;
        this.ownerRepository = ownerRepository;
    }

    @Override
    @Transactional
    public void create(Owner owner, Pet pet, NotificationType type, String title, String message) {
        // Tôn trọng tùy chọn nhận thông báo của owner (Profile → Notifications).
        if (owner != null && !allowedByPrefs(owner, type)) {
            return;
        }
        Notification n = Notification.builder()
                .owner(owner)
                .pet(pet)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .build();
        notificationRepository.save(n);
    }

    /** Owner có bật nhận loại thông báo này không (theo 3 công tắc scans / lost / updates). */
    private boolean allowedByPrefs(Owner owner, NotificationType type) {
        return switch (type) {
            case SCAN, LOCATION -> owner.isNotifScans();   // "Cảnh báo quét"
            case ALERT          -> owner.isNotifLost();     // "Cảnh báo đi lạc & báo tìm thấy"
            case SYSTEM         -> owner.isNotifUpdates();  // "Cập nhật sản phẩm"
            case MEDICAL        -> true;                    // nhắc y tế: luôn gửi
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String ownerPrincipal) {
        Owner owner = requireOwner(ownerPrincipal);
        return notificationRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream().map(NotificationResponse::from).toList();
    }

    @Override
    @Transactional
    public NotificationResponse markRead(String ownerPrincipal, Long id) {
        Owner owner = requireOwner(ownerPrincipal);
        Notification n = notificationRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public int markAllRead(String ownerPrincipal) {
        Owner owner = requireOwner(ownerPrincipal);
        return notificationRepository.markAllRead(owner.getId());
    }

    @Override
    @Transactional
    public long clearAll(String ownerPrincipal) {
        Owner owner = requireOwner(ownerPrincipal);
        return notificationRepository.deleteByOwnerId(owner.getId());
    }

    private Owner requireOwner(String principal) {
        return ownerRepository.findByPrincipal(principal)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }
}
