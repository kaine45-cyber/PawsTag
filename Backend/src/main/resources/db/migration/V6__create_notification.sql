-- V6: thông báo cho owner (SCAN / LOCATION / MEDICAL / ALERT / SYSTEM)
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES owners(owner_id),
    pet_id          BIGINT REFERENCES pets(pet_id) ON DELETE SET NULL,
    type            VARCHAR(20),                    -- SCAN / LOCATION / MEDICAL / ALERT / SYSTEM
    title           VARCHAR(200),                   -- tiêu đề hiển thị (FE tách title + body)
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_owner ON notifications(owner_id);
