package vn.pawstag.dto.response;

import vn.pawstag.entity.EmergencyContact;

public record EmergencyContactResponse(
        String id,
        String name,
        String phone,
        String relationship,
        int priority
) {
    public static EmergencyContactResponse from(EmergencyContact c) {
        return new EmergencyContactResponse(
                String.valueOf(c.getId()),
                c.getName(),
                c.getPhone(),
                c.getRelationship(),
                c.getPriority()
        );
    }
}
