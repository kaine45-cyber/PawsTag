package vn.pawstag.dto.response;

import vn.pawstag.entity.Tag;

public record TagResponse(
        String id,
        String publicCode,
        String label,
        String status,
        String type,
        boolean nfcLinked,
        String petId,
        String createdAt,
        String activatedAt
) {
    public static TagResponse from(Tag t) {
        return new TagResponse(
                String.valueOf(t.getId()),
                t.getPublicCode(),
                t.getLabel(),
                t.getStatus().name(),
                t.getType().name(),
                t.isNfcLinked(),
                t.getPet() != null ? String.valueOf(t.getPet().getId()) : null,
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null,
                t.getActivatedAt() != null ? t.getActivatedAt().toString() : null
        );
    }
}
