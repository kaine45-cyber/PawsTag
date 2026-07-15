package vn.pawstag.service;

import vn.pawstag.dto.response.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboard(String ownerPrincipal);
}
