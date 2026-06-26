-- V2: bảng pets (theo PawsTag-Backend-Structure-v4.md)
CREATE TABLE pets (
    pet_id               BIGSERIAL PRIMARY KEY,
    owner_id             BIGINT NOT NULL REFERENCES owners(owner_id),
    -- cơ bản
    name                 VARCHAR(100) NOT NULL,
    type                 VARCHAR(50),
    breed                VARCHAR(100),
    color                VARCHAR(50),
    birth_date           DATE,                       -- age tính trong DTO
    weight               NUMERIC(5,2),
    gender               VARCHAR(20),
    collar               VARCHAR(150),
    contact_phone        VARCHAR(20),                -- số "Call Owner" trên tag
    -- y tế
    vaccinated           BOOLEAN NOT NULL DEFAULT false,
    blood_type           VARCHAR(10),
    microchip_id         VARCHAR(50),
    allergies            TEXT,
    conditions           TEXT,                       -- pet.medical.conditions
    medications          TEXT,
    last_vet_visit       DATE,
    vet_name             VARCHAR(100),
    vet_phone            VARCHAR(20),
    medical_info         TEXT,
    identification_notes TEXT,
    emergency_message    TEXT,
    photo_url            VARCHAR(500),
    -- privacy (lọc phía SERVER)
    show_phone           BOOLEAN NOT NULL DEFAULT true,
    show_owner_name      BOOLEAN NOT NULL DEFAULT true,
    show_location        BOOLEAN NOT NULL DEFAULT true,
    -- lost mode (safe/lost suy từ is_lost)
    is_lost              BOOLEAN NOT NULL DEFAULT false,
    lost_message         TEXT,
    reward_amount        NUMERIC(12,2),
    alert_radius_km      INT DEFAULT 5,
    lost_since           TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
