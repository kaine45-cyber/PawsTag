package vn.pawstag.service;

import vn.pawstag.dto.response.BatchTagResponse;
import vn.pawstag.dto.response.TagResponse;
import vn.pawstag.entity.Pet;

import java.util.List;

public interface TagService {

    /** Tự sinh 1 tag ACTIVE khi tạo pet (luồng digital-first). */
    void createForPet(Pet pet);

    /** Thu hồi tag của pet (khi xóa pet) → trả về UNASSIGNED, gỡ pet. */
    void releaseTagsForPet(Pet pet);

    /** (ADMIN) Sinh N tag trống (UNASSIGNED) để in. */
    BatchTagResponse generateBatch(int quantity);

    /** Gán publicCode (UNASSIGNED) vào pet của owner. */
    TagResponse activate(String ownerEmail, String publicCode, Long petId);

    /** Đánh dấu nfc_linked. */
    TagResponse markNfc(String ownerEmail, Long tagId, boolean enabled);

    /** Danh sách tag của owner. */
    List<TagResponse> listMine(String ownerEmail);
}
