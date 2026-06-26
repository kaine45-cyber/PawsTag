package vn.pawstag.dto.response;

/**
 * Kết quả tra cứu tag công khai.
 * status: NOT_FOUND (không có code) / UNASSIGNED (tag chưa gán pet) / ACTIVE (có pet).
 */
public record PublicScanResponse(
        String status,
        PublicPetResponse pet
) {
    public static PublicScanResponse notFound() {
        return new PublicScanResponse("NOT_FOUND", null);
    }

    public static PublicScanResponse unassigned() {
        return new PublicScanResponse("UNASSIGNED", null);
    }

    public static PublicScanResponse active(PublicPetResponse pet) {
        return new PublicScanResponse("ACTIVE", pet);
    }
}
