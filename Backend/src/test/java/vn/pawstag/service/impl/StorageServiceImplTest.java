package vn.pawstag.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import vn.pawstag.exception.BadRequestException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageServiceImplTest {

    @Test
    void store_withoutSupabaseConfiguration_rejectsInsteadOfWritingToLocalDisk() {
        StorageServiceImpl storage = new StorageServiceImpl("", "", "pawstag-media");
        MockMultipartFile image = new MockMultipartFile(
                "file", "pet.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> storage.store(image, "pets"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not configured");
    }
}
