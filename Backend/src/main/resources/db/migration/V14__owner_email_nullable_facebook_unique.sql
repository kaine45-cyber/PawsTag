-- V14: chuẩn bị cho Facebook login.
-- 1) Facebook có thể KHÔNG trả email (user đăng ký bằng SĐT / từ chối quyền email)
--    → email phải nullable. UNIQUE inline từ V1 giữ nguyên: Postgres cho phép nhiều NULL.
--    Chuỗi auth không còn phụ thuộc email (JWT subject = ownerId từ trước migration này).
ALTER TABLE owners ALTER COLUMN email DROP NOT NULL;

-- 2) 1 tài khoản Facebook (facebook_id) chỉ gắn với 1 owner — cùng pattern V13 (google_id).
CREATE UNIQUE INDEX idx_owners_facebook_id ON owners(facebook_id) WHERE facebook_id IS NOT NULL;
