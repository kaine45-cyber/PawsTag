package vn.pawstag.dto.response;

import java.util.List;

/**
 * GET /api/dashboard. Khớp màn /dashboard.
 * activeTags/scansToday/totalScans/recentScans sẽ đầy đủ ở Phase 3–4
 * (khi có tags + scan_logs); Phase 2 trả 0 / rỗng.
 */
public record DashboardResponse(
        Stats stats,
        List<PetResponse> pets,
        List<RecentScan> recentScans
) {
    public record Stats(
            long totalPets,
            long activeTags,
            long scansToday,
            long totalScans,
            long lostModeActive,
            long unreadNotifications
    ) {}

    public record RecentScan(
            String petName,
            String petAvatar,
            String location,
            String time
    ) {}
}
