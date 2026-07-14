package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.entity.Owner;
import vn.pawstag.entity.Pet;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.mapper.PetMapper;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.service.StorageService;
import vn.pawstag.service.TagService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit test PetServiceImpl.create theo mô hình "QR in trước": pet PHẢI kèm publicCode hợp lệ.
 * Không tự sinh tag; việc gán tag ủy quyền cho TagService (mock ở đây, xem TagServiceImplTest).
 */
@ExtendWith(MockitoExtension.class)
class PetServiceImplTest {

    @Mock PetRepository petRepository;
    @Mock OwnerRepository ownerRepository;
    @Mock PetMapper petMapper;
    @Mock TagService tagService;
    @Mock StorageService storageService;

    PetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PetServiceImpl(petRepository, ownerRepository, petMapper, tagService, storageService);
    }

    /** PetRequest tối thiểu: chỉ name + publicCode, phần còn lại null. Khớp thứ tự field trong record. */
    private PetRequest requestWith(String publicCode) {
        return new PetRequest(
                "Bobby", publicCode, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
    }

    @Test
    void create_withValidCode_savesPetThenActivatesTag() {
        Owner owner = new Owner();
        owner.setId(1L);
        owner.setEmail("a@b.com");
        when(ownerRepository.findByEmail("a@b.com")).thenReturn(Optional.of(owner));
        Pet saved = new Pet();
        saved.setId(10L);
        when(petRepository.save(any(Pet.class))).thenReturn(saved);

        service.create("a@b.com", requestWith("ABC123"));

        // Thứ tự bắt buộc: lưu pet TRƯỚC, rồi gán tag đã in sẵn (cùng transaction).
        InOrder ordered = inOrder(petRepository, tagService);
        ordered.verify(petRepository).save(any(Pet.class));
        ordered.verify(tagService).assignExistingTagToPet("ABC123", saved);
    }

    @Test
    void create_withBlankCode_throwsAndTouchesNothing() {
        assertThatThrownBy(() -> service.create("a@b.com", requestWith("   ")))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.create("a@b.com", requestWith(null)))
                .isInstanceOf(BadRequestException.class);

        // Validate mã QR TRƯỚC khi chạm owner/pet/tag — không tạo pet mồ côi.
        verifyNoInteractions(ownerRepository);
        verify(petRepository, never()).save(any());
        verify(tagService, never()).assignExistingTagToPet(anyString(), any());
    }
}
