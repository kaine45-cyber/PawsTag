package vn.pawstag.dto.response;

import java.util.List;

/**
 * Khớp chính xác frontend types/pet.ts (Pet + nested PetMedical).
 * Các field "tính ra": age (từ birthDate), tagCode (join tags — Phase 3),
 * scansToday/totalScans (count scan_logs — Phase 4).
 */
public record PetResponse(
        String id,
        String ownerId,
        String name,
        String species,          // = pet.type
        String breed,
        String gender,
        String birthDate,        // ISO yyyy-MM-dd
        Integer ageMonths,       // tổng số tháng tuổi (frontend tự format theo ngôn ngữ)
        String weight,           // số dạng chuỗi "12.5"
        String color,
        String collar,
        String identificationNotes,
        String photo,            // = pet.photoUrl
        String status,           // "safe" | "lost" (suy từ is_lost)
        String tagCode,          // join tags (Phase 3) — tạm null
        String phone,            // = pet.contactPhone
        String emergencyMessage,
        int scansToday,          // Phase 4 — tạm 0
        int totalScans,          // Phase 4 — tạm 0
        Medical medical,

        // ── lost-mode (cho /pet/[id]/lost-mode) ──
        String lostMessage,
        java.math.BigDecimal rewardAmount,
        Integer alertRadiusKm,

        List<EmergencyContactResponse> emergencyContacts
) {
    public record Medical(
            String allergies,
            String conditions,
            String medications,
            String bloodType,
            String microchipId,
            String lastVetVisit,
            String vetName,
            String vetPhone
    ) {}
}
