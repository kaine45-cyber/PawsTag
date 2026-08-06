package vn.pawstag.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import vn.pawstag.exception.BadRequestException;

import java.lang.reflect.Method;
import java.net.http.HttpRequest;

import static org.assertj.core.api.Assertions.assertThat;
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

    @Test
    void newSupabaseSecretKey_isSentOnlyInApiKeyHeader() throws Exception {
        StorageServiceImpl storage = new StorageServiceImpl(
                "https://example.supabase.co", "sb_secret_example", "pawstag-media");

        Method requestBuilder = StorageServiceImpl.class.getDeclaredMethod("requestBuilder", String.class);
        requestBuilder.setAccessible(true);
        HttpRequest request = ((HttpRequest.Builder) requestBuilder.invoke(storage, "/bucket"))
                .GET()
                .build();

        assertThat(request.headers().firstValue("apikey")).contains("sb_secret_example");
        assertThat(request.headers().firstValue("Authorization")).isEmpty();
    }
}
