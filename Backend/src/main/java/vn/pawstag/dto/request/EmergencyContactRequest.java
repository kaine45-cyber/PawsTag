package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EmergencyContactRequest(
        String name,

        @NotBlank(message = "is required")
        String phone,

        String relationship,

        Integer priority
) {}
