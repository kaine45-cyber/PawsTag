package vn.pawstag.dto.response;

import java.math.BigDecimal;

/**
 * Hồ sơ công khai khi quét QR (/t/{code}).
 * ĐÃ LỌC privacy ở SERVER: phone null nếu show_phone=false,
 * ownerName null nếu show_owner_name=false.
 */
public record PublicPetResponse(
        String name,
        String species,
        String breed,
        Integer ageMonths,
        String gender,
        String weight,
        String color,
        String photo,
        String status,            // "safe" | "lost"
        String emergencyMessage,
        String phone,             // null nếu show_phone=false
        String ownerName,         // null nếu show_owner_name=false
        boolean vaccinated,
        String collar,
        String identificationNotes,
        Medical medical,
        String lostMessage,
        BigDecimal rewardAmount,
        String tagCode
) {
    public record Medical(
            String allergies,
            String conditions,
            String medications,
            String bloodType,
            String microchipId,
            String lastVetVisit,
            String vetName
    ) {}
}
