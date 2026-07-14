package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import vn.pawstag.dto.response.PublicScanResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.enums.TagType;
import vn.pawstag.mapper.PetMapper;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.ScanLogRepository;
import vn.pawstag.repository.TagRepository;
import vn.pawstag.service.NotificationService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit test tra cứu công khai /public/t/{code}:
 * ACTIVE → trả hồ sơ pet; UNASSIGNED → "chưa kích hoạt"; không có mã → NOT_FOUND.
 */
@ExtendWith(MockitoExtension.class)
class ScanServiceImplTest {

    @Mock TagRepository tagRepository;
    @Mock ScanLogRepository scanLogRepository;
    @Mock OwnerRepository ownerRepository;
    @Mock NotificationService notificationService;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock PetMapper petMapper;

    ScanServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ScanServiceImpl(tagRepository, scanLogRepository, ownerRepository,
                notificationService, eventPublisher, petMapper);
    }

    @Test
    void lookup_activeTag_returnsPetProfile() {
        Owner owner = new Owner();
        owner.setFullName("Alice");
        Pet pet = new Pet();
        pet.setName("Bobby");
        pet.setType("dog");
        pet.setOwner(owner);
        pet.setShowPhone(true);
        pet.setShowOwnerName(true);
        pet.setContactPhone("0900000000");
        Tag tag = Tag.builder()
                .publicCode("ABC123").status(TagStatus.ACTIVE).type(TagType.QR).pet(pet).build();
        when(tagRepository.findByPublicCode("ABC123")).thenReturn(Optional.of(tag));
        when(petMapper.ageMonthsOf(pet)).thenReturn(12);
        when(petMapper.weightOf(pet)).thenReturn("5");

        PublicScanResponse res = service.lookup("abc123");

        assertThat(res.status()).isEqualTo("ACTIVE");
        assertThat(res.pet()).isNotNull();
        assertThat(res.pet().name()).isEqualTo("Bobby");
        assertThat(res.pet().tagCode()).isEqualTo("ABC123");
        assertThat(res.pet().phone()).isEqualTo("0900000000");
    }

    @Test
    void lookup_unassignedTag_returnsUnassigned() {
        Tag tag = Tag.builder()
                .publicCode("ABC123").status(TagStatus.UNASSIGNED).type(TagType.QR).build();
        when(tagRepository.findByPublicCode("ABC123")).thenReturn(Optional.of(tag));

        PublicScanResponse res = service.lookup("abc123");

        assertThat(res.status()).isEqualTo("UNASSIGNED");
        assertThat(res.pet()).isNull();
    }

    @Test
    void lookup_unknownCode_returnsNotFound() {
        when(tagRepository.findByPublicCode("ZZZ999")).thenReturn(Optional.empty());

        PublicScanResponse res = service.lookup("zzz999");

        assertThat(res.status()).isEqualTo("NOT_FOUND");
        assertThat(res.pet()).isNull();
    }
}
