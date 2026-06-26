-- V4: bảng tags (public_code ngẫu nhiên trong URL quét; label hiển thị cho owner)
CREATE TABLE tags (
    tag_id       BIGSERIAL PRIMARY KEY,
    public_code  VARCHAR(20) UNIQUE NOT NULL,        -- ngẫu nhiên, nằm trong URL /t/{code}
    label        VARCHAR(50),                        -- tên hiển thị (PAWS-BBY-2026)
    pet_id       BIGINT REFERENCES pets(pet_id),     -- NULLABLE: null = chưa gán
    status       VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED',  -- UNASSIGNED / ACTIVE
    type         VARCHAR(10) NOT NULL DEFAULT 'QR',  -- QR / NFC
    nfc_linked   BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    activated_at TIMESTAMP
);

CREATE INDEX idx_tags_public_code ON tags(public_code);
CREATE INDEX idx_tags_pet ON tags(pet_id);
