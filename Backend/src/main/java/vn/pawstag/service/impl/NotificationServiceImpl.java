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

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String ownerEmail) {
        Owner owner = requireOwner(ownerEmail);
        return notificationRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream().map(NotificationResponse::from).toList();
    }

    @Override
    @Transactional
    public NotificationResponse markRead(String ownerEmail, Long id) {
        Owner owner = requireOwner(ownerEmail);
        Notification n = notificationRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public int markAllRead(String ownerEmail) {
        Owner owner = requireOwner(ownerEmail);
        return notificationRepository.markAllRead(owner.getId());
    }

    @Override
    @Transactional
    public long clearAll(String ownerEmail) {
        Owner owner = requireOwner(ownerEmail);
        return notificationRepository.deleteByOwnerId(owner.getId());
    }

    private Owner requireOwner(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }
}
