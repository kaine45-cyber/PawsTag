-- V3: liên hệ khẩn cấp (1 pet có N liên hệ, sắp theo priority)
CREATE TABLE emergency_contacts (
    contact_id   BIGSERIAL PRIMARY KEY,
    pet_id       BIGINT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    name         VARCHAR(100),
    phone        VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    priority     INT NOT NULL DEFAULT 1,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_pet ON emergency_contacts(pet_id);
