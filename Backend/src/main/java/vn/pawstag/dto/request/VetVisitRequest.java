package vn.pawstag.dto.request;

import java.time.LocalDate;

public record VetVisitRequest(
        String vetName,
        String clinic,
        String note,
        LocalDate visitDate
) {}
