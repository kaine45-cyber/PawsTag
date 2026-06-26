package vn.pawstag.dto.response;

import java.util.List;

/**
 * Kết quả sinh batch tag (ADMIN).
 */
public record BatchTagResponse(
        int count,
        List<String> codes
) {}
