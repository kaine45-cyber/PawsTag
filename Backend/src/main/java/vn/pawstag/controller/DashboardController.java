package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.DashboardResponse;
import vn.pawstag.service.DashboardService;

@RestController
@RequestMapping("/dashboard")
@Tag(name = "Dashboard", description = "Tổng quan trang chủ")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(summary = "Stats + pets + scan gần đây")
    public ApiResponse<DashboardResponse> dashboard(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(dashboardService.getDashboard(principal.getUsername()));
    }
}
