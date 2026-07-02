-- V9: tùy chọn nhận thông báo cho owner
ALTER TABLE owners ADD COLUMN notif_scans   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE owners ADD COLUMN notif_lost    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE owners ADD COLUMN notif_updates BOOLEAN NOT NULL DEFAULT true;
