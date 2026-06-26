package vn.pawstag.dto.response;

import vn.pawstag.entity.Pet;
import vn.pawstag.entity.ScanLog;
import vn.pawstag.util.TimeUtil;

/**
 * Khớp frontend types/scan.ts ScanLog:
 * { id, petId, petName, petAvatar, location, lat, lng, timestamp, timeAgo }.
 */
public record ScanLogResponse(
        String id,
        String petId,
        String petName,
        String petAvatar,
        String location,
        Double lat,
        Double lng,
        String timestamp,
        String timeAgo
) {
    public static ScanLogResponse from(ScanLog s) {
        Pet pet = s.getTag() != null ? s.getTag().getPet() : null;
        return new ScanLogResponse(
                String.valueOf(s.getId()),
                pet != null ? String.valueOf(pet.getId()) : null,
                pet != null ? pet.getName() : "Unknown",
                pet != null ? pet.getPhotoUrl() : null,
                s.getLocationName() != null ? s.getLocationName() : "Unknown location",
                s.getLatitude(),
                s.getLongitude(),
                s.getScannedAt() != null ? s.getScannedAt().toString() : null,
                TimeUtil.relative(s.getScannedAt())
        );
    }
}
