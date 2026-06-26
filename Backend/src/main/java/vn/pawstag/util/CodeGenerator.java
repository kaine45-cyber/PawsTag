package vn.pawstag.util;

import org.springframework.stereotype.Component;
import vn.pawstag.repository.TagRepository;

import java.security.SecureRandom;

/**
 * Sinh public_code ngẫu nhiên cho tag (chống đoán).
 * Bảng ký tự bỏ ký tự dễ nhầm (0/O, 1/I) — 6 ký tự, đảm bảo duy nhất.
 */
@Component
public class CodeGenerator {

    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int LENGTH = 6;
    private static final int MAX_TRIES = 10;

    private final SecureRandom random = new SecureRandom();
    private final TagRepository tagRepository;

    public CodeGenerator(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    /** Sinh mã 6 ký tự duy nhất (kiểm tra trùng trong DB). */
    public String uniquePublicCode() {
        for (int i = 0; i < MAX_TRIES; i++) {
            String code = random6();
            if (!tagRepository.existsByPublicCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique tag code, please retry");
    }

    private String random6() {
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
