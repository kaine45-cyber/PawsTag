package vn.pawstag.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.OwnerUpdateRequest;
import vn.pawstag.dto.response.OwnerResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.exception.ResourceNotFoundException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.service.OwnerService;
import vn.pawstag.service.StorageService;

@Service
public class OwnerServiceImpl implements OwnerService {

    private final OwnerRepository ownerRepository;
    private final StorageService storageService;

    public OwnerServiceImpl(OwnerRepository ownerRepository, StorageService storageService) {
        this.ownerRepository = ownerRepository;
        this.storageService = storageService;
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerResponse getMe(String email) {
        return OwnerResponse.from(require(email));
    }

    @Override
    @Transactional
    public OwnerResponse update(String email, OwnerUpdateRequest request) {
        Owner owner = require(email);
        if (request.name() != null)  owner.setFullName(request.name().trim());
        if (request.phone() != null) owner.setPhone(request.phone().trim());
        if (request.city() != null)  owner.setCity(request.city().trim());
        return OwnerResponse.from(ownerRepository.save(owner));
    }

    @Override
    @Transactional
    public OwnerResponse setAvatar(String email, MultipartFile file) {
        Owner owner = require(email);
        owner.setAvatarUrl(storageService.store(file, "avatars"));
        return OwnerResponse.from(ownerRepository.save(owner));
    }

    private Owner require(String email) {
        return ownerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }
}
