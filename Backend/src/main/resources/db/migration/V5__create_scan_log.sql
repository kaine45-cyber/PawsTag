-- V5: nhật ký quét tag (luôn lưu lat/lng; location_name reverse-geocode sau)
CREATE TABLE scan_logs (
    scan_id       BIGSERIAL PRIMARY KEY,
    tag_id        BIGINT NOT NULL REFERENCES tags(tag_id),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    location_name VARCHAR(200),                      -- nullable, reverse-geocode sau
    user_agent    VARCHAR(300),
    device_type   VARCHAR(50),                       -- mobile / desktop
    scanned_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_tag ON scan_logs(tag_id);
CREATE INDEX idx_scan_scanned_at ON scan_logs(scanned_at);
