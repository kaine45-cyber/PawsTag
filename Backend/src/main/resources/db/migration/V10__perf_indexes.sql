-- V10: index hỗ trợ phân trang & truy vấn theo thời gian
CREATE INDEX IF NOT EXISTS idx_notif_owner_created ON notifications(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_scanned_desc   ON scan_logs(scanned_at DESC);
