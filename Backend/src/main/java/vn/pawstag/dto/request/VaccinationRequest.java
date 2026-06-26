package vn.pawstag.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record VaccinationRequest(
        @NotBlank(message = "is required")
        String name,
        LocalDate givenDate,
        LocalDate dueDate
) {}
