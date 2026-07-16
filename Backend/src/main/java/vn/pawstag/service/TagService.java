package vn.pawstag.service;

import vn.pawstag.dto.response.BatchTagResponse;
import vn.pawstag.dto.response.TagResponse;
import vn.pawstag.entity.Pet;

import java.util.List;

public interface TagService {

    /**
     * Kích hoạt một tag ĐÃ IN SẴN (UNASSIGNED, pet_id = null) vào pet vừa tạo.
     * QR được admin sinh trước qua {@link #generateBatch(int)}; luồng tạo pet KHÔNG tự sinh mã mới.
     * Ném BadRequestException nếu mã không tồn tại / đã gán pet khác / pet đã có thẻ ACTIVE.
     */
    void assignExistingTagToPet(String publicCode, Pet pet);

    /** Thu hồi tag của pet (khi xóa pet) → trả về UNASSIGNED, gỡ pet. */
    void releaseTagsForPet(Pet pet);

    /** (ADMIN) Sinh N tag trống (UNASSIGNED) để in. */
    BatchTagResponse generateBatch(int quantity);

    /** Gán publicCode (UNASSIGNED) vào pet của owner. */
    TagResponse activate(String ownerPrincipal, String publicCode, Long petId);

    /** Đánh dấu nfc_linked. */
    TagResponse markNfc(String ownerPrincipal, Long tagId, boolean enabled);

    /** Danh sách tag của owner. */
    List<TagResponse> listMine(String ownerPrincipal);
}
