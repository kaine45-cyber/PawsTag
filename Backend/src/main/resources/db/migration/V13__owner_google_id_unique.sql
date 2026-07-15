-- V13: đảm bảo 1 tài khoản Google (google_id) chỉ gắn với 1 owner.
-- Partial unique index: chỉ áp dụng khi google_id IS NOT NULL → không đụng dữ liệu cũ
-- (các owner LOCAL đang có google_id = null vẫn hợp lệ, không bị ràng buộc unique).
CREATE UNIQUE INDEX idx_owners_google_id ON owners(google_id) WHERE google_id IS NOT NULL;
