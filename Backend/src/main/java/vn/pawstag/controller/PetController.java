package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pawstag.dto.request.LostModeRequest;
import vn.pawstag.dto.request.PetRequest;
import vn.pawstag.dto.request.VaccinationRequest;
import vn.pawstag.dto.request.VetVisitRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.PassportResponse;
import vn.pawstag.dto.response.PetResponse;
import vn.pawstag.service.HealthRecordService;
import vn.pawstag.service.PassportService;
import vn.pawstag.service.PetService;

import java.util.List;

@RestController
@RequestMapping("/pets")
@Tag(name = "Pets", description = "Quản lý hồ sơ thú cưng")
@SecurityRequirement(name = "bearerAuth")
public class PetController {

    private final PetService petService;
    private final PassportService passportService;
    private final HealthRecordService healthRecordService;

    public PetController(PetService petService, PassportService passportService,
                         HealthRecordService healthRecordService) {
        this.petService = petService;
        this.passportService = passportService;
        this.healthRecordService = healthRecordService;
    }

    @PostMapping
    @Operation(summary = "Tạo hồ sơ thú cưng")
    public ResponseEntity<ApiResponse<PetResponse>> create(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody PetRequest request) {
        PetResponse data = petService.create(principal.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(data, "Pet created"));
    }

    @GetMapping
    @Operation(summary = "Danh sách thú cưng của tôi")
    public ApiResponse<List<PetResponse>> list(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(petService.list(principal.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết thú cưng")
    public ApiResponse<PetResponse> get(@AuthenticationPrincipal UserDetails principal,
                                        @PathVariable Long id) {
        return ApiResponse.ok(petService.get(principal.getUsername(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thú cưng")
    public ApiResponse<PetResponse> update(@AuthenticationPrincipal UserDetails principal,
                                           @PathVariable Long id,
                                           @Valid @RequestBody PetRequest request) {
        return ApiResponse.ok(petService.update(principal.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thú cưng")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserDetails principal,
                                    @PathVariable Long id) {
        petService.delete(principal.getUsername(), id);
        return ApiResponse.ok(null, "Pet deleted");
    }

    @PutMapping("/{id}/lost-mode")
    @Operation(summary = "Bật/tắt Lost Mode")
    public ApiResponse<PetResponse> lostMode(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable Long id,
                                             @Valid @RequestBody LostModeRequest request) {
        return ApiResponse.ok(petService.setLostMode(principal.getUsername(), id, request));
    }

    @PostMapping(value = "/{id}/photo", consumes = "multipart/form-data")
    @Operation(summary = "Tải lên ảnh thú cưng")
    public ApiResponse<PetResponse> photo(@AuthenticationPrincipal UserDetails principal,
                                          @PathVariable Long id,
                                          @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(petService.setPhoto(principal.getUsername(), id, file), "Photo updated");
    }

    @GetMapping("/{id}/passport")
    @Operation(summary = "Hồ sơ Pet Passport đầy đủ (Profile/Health/Travel)")
    public ApiResponse<PassportResponse> passport(@AuthenticationPrincipal UserDetails principal,
                                                  @PathVariable Long id) {
        return ApiResponse.ok(passportService.getPassport(principal.getUsername(), id));
    }

    // ── Health records (vaccinations + vet visits) ──

    @PostMapping("/{id}/vaccinations")
    @Operation(summary = "Thêm mũi tiêm")
    public ApiResponse<PassportResponse> addVaccination(@AuthenticationPrincipal UserDetails principal,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody VaccinationRequest req) {
        healthRecordService.addVaccination(principal.getUsername(), id, req);
        return ApiResponse.ok(passportService.getPassport(principal.getUsername(), id), "Vaccination added");
    }

    @DeleteMapping("/{id}/vaccinations/{vaccId}")
    @Operation(summary = "Xóa mũi tiêm")
    public ApiResponse<PassportResponse> deleteVaccination(@AuthenticationPrincipal UserDetails principal,
                                                           @PathVariable Long id,
                                                           @PathVariable Long vaccId) {
        healthRecordService.deleteVaccination(principal.getUsername(), id, vaccId);
        return ApiResponse.ok(passportService.getPassport(principal.getUsername(), id), "Vaccination removed");
    }

    @PostMapping("/{id}/vet-visits")
    @Operation(summary = "Thêm lần khám thú y")
    public ApiResponse<PassportResponse> addVetVisit(@AuthenticationPrincipal UserDetails principal,
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody VetVisitRequest req) {
        healthRecordService.addVetVisit(principal.getUsername(), id, req);
        return ApiResponse.ok(passportService.getPassport(principal.getUsername(), id), "Vet visit added");
    }

    @DeleteMapping("/{id}/vet-visits/{visitId}")
    @Operation(summary = "Xóa lần khám thú y")
    public ApiResponse<PassportResponse> deleteVetVisit(@AuthenticationPrincipal UserDetails principal,
                                                        @PathVariable Long id,
                                                        @PathVariable Long visitId) {
        healthRecordService.deleteVetVisit(principal.getUsername(), id, visitId);
        return ApiResponse.ok(passportService.getPassport(principal.getUsername(), id), "Vet visit removed");
    }
}
