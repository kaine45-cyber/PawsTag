package vn.pawstag.dto.response;

import vn.pawstag.entity.Owner;

/**
 * Khớp frontend types/owner.ts: { id, name, email, phone, avatar, city }.
 * id trả dạng String để khớp Owner.id (string) ở frontend.
 */
public record OwnerResponse(
        String id,
        String name,
        String email,
        String phone,
        String avatar,
        String city
) {
    public static OwnerResponse from(Owner o) {
        return new OwnerResponse(
                String.valueOf(o.getId()),
                o.getFullName(),
                o.getEmail(),
                o.getPhone(),
                o.getAvatarUrl(),
                o.getCity()
        );
    }
}
