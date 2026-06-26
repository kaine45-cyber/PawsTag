package vn.pawstag.dto.response;

import java.util.List;

/** Hồ sơ Pet Passport đầy đủ (3 tab: Profile / Health / Travel). */
public record PassportResponse(
        String petId,
        String name,
        String breed,
        String photo,
        String passportNo,
        String issued,
        String pawstagId,
        String mrz,

        Identity identity,
        Microchip microchip,
        Owner owner,
        Health health,
        List<VaccinationItem> vaccinations,
        List<VetVisitItem> vetVisits,
        MedicalNotes medical,
        List<TravelItem> travel
) {
    public record Identity(
            String fullName, String species, String breed,
            String dateOfBirth, String age, String weight,
            String primaryColor, String eyeColor
    ) {}

    public record Microchip(
            String microchipId, String implantDate, String implantLocation, String pawstagId
    ) {}

    public record Owner(String name, String phone, String city, String avatar) {}

    public record Health(int vaccinesValid, int vaccinesTotal, int vetVisitsThisYear, int healthScore) {}

    public record VaccinationItem(String id, String name, String given, String due, String status) {}

    public record VetVisitItem(String id, String vetName, String clinic, String note, String date) {}

    public record MedicalNotes(
            String bloodType, String idealWeight, String allergies,
            String medications, String neutered, String diet
    ) {}

    public record TravelItem(String item, String detail, String status) {}
}
