package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Tag;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.enums.TagType;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.repository.PetRepository;
import vn.pawstag.repository.TagRepository;
import vn.pawstag.util.CodeGenerator;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test luồng "QR in trước, kích hoạt sau": chỉ gán được tag ĐÃ TỒN TẠI và đang UNASSIGNED.
 * Không chạm DB — mock repository. Không có mã nào được tự sinh khi gán vào pet.
 */
@ExtendWith(MockitoExtension.class)
class TagServiceImplTest {

    @Mock TagRepository tagRepository;
    @Mock PetRepository petRepository;
    @Mock OwnerRepository ownerRepository;
    @Mock CodeGenerator codeGenerator;

    TagServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TagServiceImpl(tagRepository, petRepository, ownerRepository, codeGenerator);
    }

    private Pet petWithId(Long id) {
        Pet pet = new Pet();
        pet.setId(id);
        pet.setName("Bobby");
        return pet;
    }

    private Tag unassignedTag(String code) {
        return Tag.builder()
                .id(1L).publicCode(code).status(TagStatus.UNASSIGNED)
                .type(TagType.QR).nfcLinked(false).build();
    }

    @Test
    void assign_withUnassignedCode_activatesTag() {
        Pet pet = petWithId(1L);
        Tag tag = unassignedTag("ABC123");
        when(tagRepository.findByPublicCode("ABC123")).thenReturn(Optional.of(tag));
        when(tagRepository.findFirstByPetIdAndStatus(1L, TagStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));

        service.assignExistingTagToPet("abc123", pet); // chữ thường → normalize thành ABC123

        assertThat(tag.getStatus()).isEqualTo(TagStatus.ACTIVE);
        assertThat(tag.getPet()).isSameAs(pet);
        assertThat(tag.getActivatedAt()).isNotNull();
        verify(tagRepository).save(tag);
    }

    @Test
    void assign_withUnknownCode_throwsAndSavesNothing() {
        Pet pet = petWithId(1L);
        when(tagRepository.findByPublicCode("NOPE12")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignExistingTagToPet("nope12", pet))
                .isInstanceOf(BadRequestException.class);

        verify(tagRepository, never()).save(any());
    }

    @Test
    void assign_withAlreadyActiveCode_throwsAndSavesNothing() {
        Pet pet = petWithId(1L);
        Tag tag = Tag.builder()
                .id(2L).publicCode("USED12").status(TagStatus.ACTIVE)
                .type(TagType.QR).pet(petWithId(9L)).build();
        when(tagRepository.findByPublicCode("USED12")).thenReturn(Optional.of(tag));

        assertThatThrownBy(() -> service.assignExistingTagToPet("used12", pet))
                .isInstanceOf(BadRequestException.class);

        verify(tagRepository, never()).save(any());
    }

    @Test
    void assign_whenPetAlreadyHasActiveTag_throws() {
        Pet pet = petWithId(1L);
        Tag fresh = unassignedTag("FRESH1");
        when(tagRepository.findByPublicCode("FRESH1")).thenReturn(Optional.of(fresh));
        when(tagRepository.findFirstByPetIdAndStatus(1L, TagStatus.ACTIVE))
                .thenReturn(Optional.of(Tag.builder().id(5L).publicCode("OLD999").status(TagStatus.ACTIVE).build()));

        assertThatThrownBy(() -> service.assignExistingTagToPet("fresh1", pet))
                .isInstanceOf(BadRequestException.class);

        verify(tagRepository, never()).save(any());
    }
}
