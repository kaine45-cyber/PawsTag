package vn.pawstag.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.pawstag.dto.request.ActivateTagRequest;
import vn.pawstag.dto.request.BatchTagRequest;
import vn.pawstag.dto.request.NfcRequest;
import vn.pawstag.dto.response.ApiResponse;
import vn.pawstag.dto.response.BatchTagResponse;
import vn.pawstag.dto.response.TagResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import vn.pawstag.service.TagService;

import java.util.List;

@RestController
@RequestMapping("/tags")
@Tag(name = "Tags", description = "Quản lý QR/NFC tag")
@SecurityRequirement(name = "bearerAuth")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping("/mine")
    @Operation(summary = "Danh sách tag của tôi")
    public ApiResponse<List<TagResponse>> mine(@AuthenticationPrincipal UserDetails principal) {
        return ApiResponse.ok(tagService.listMine(principal.getUsername()));
    }

    @PostMapping("/batch")
    @Operation(summary = "(ADMIN) Sinh N tag trống để in")
    public ApiResponse<BatchTagResponse> batch(@Valid @RequestBody BatchTagRequest request) {
        return ApiResponse.ok(tagService.generateBatch(request.quantity()));
    }

    @PostMapping("/activate")
    @Operation(summary = "Gán public_code vào pet")
    public ApiResponse<TagResponse> activate(@AuthenticationPrincipal UserDetails principal,
                                             @Valid @RequestBody ActivateTagRequest request) {
        return ApiResponse.ok(
                tagService.activate(principal.getUsername(), request.publicCode(), request.petId()),
                "Tag activated");
    }

    @PostMapping("/{id}/nfc")
    @Operation(summary = "Bật/tắt NFC cho tag")
    public ApiResponse<TagResponse> nfc(@AuthenticationPrincipal UserDetails principal,
                                        @PathVariable Long id,
                                        @RequestBody(required = false) NfcRequest request) {
        boolean enabled = request == null || request.enabled() == null || request.enabled();
        return ApiResponse.ok(tagService.markNfc(principal.getUsername(), id, enabled));
    }
}
