package vn.pawstag.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Tạo / sửa pet. Khớp PetRequest trong v4.
 * birthDate (ISO yyyy-MM-dd) là chuẩn — age tính ở DTO response.
 */
public record PetRequest(
        @NotBlank(message = "is required")
        String name,

        // Mã QR trên thẻ vật lý (public_code). BẮT BUỘC khi tạo pet — kích hoạt thẻ đã in sẵn.
        // Không dùng khi update (bỏ qua). Validate ở PetServiceImpl.create() vì record này
        // dùng chung cho cả create lẫn update.
        String publicCode,

        String species,          // map sang pet.type
        String breed,
        String color,
        LocalDate birthDate,
        BigDecimal weight,
        String gender,
        String collar,
        String contactPhone,     // số "Call Owner"

        // y tế
        Boolean vaccinated,
        String bloodType,
        String microchipId,
        String allergies,
        String conditions,
        String medications,
        LocalDate lastVetVisit,
        String vetName,
        String vetPhone,
        String medicalInfo,
        String identificationNotes,
        String emergencyMessage,
        String photoUrl,

        // privacy (mặc định true nếu null)
        Boolean showPhone,
        Boolean showOwnerName,
        Boolean showLocation,

        @Valid
        List<EmergencyContactRequest> emergencyContacts
) {}
