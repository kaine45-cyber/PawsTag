-- V8: dữ liệu cho Pet Passport đầy đủ

-- Thêm cột nhận dạng / y tế cho pet
ALTER TABLE pets ADD COLUMN eye_color        VARCHAR(30);
ALTER TABLE pets ADD COLUMN neutered         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pets ADD COLUMN neutered_date    DATE;
ALTER TABLE pets ADD COLUMN diet             VARCHAR(120);
ALTER TABLE pets ADD COLUMN implant_date     DATE;
ALTER TABLE pets ADD COLUMN implant_location VARCHAR(60);

-- Sổ tiêm chủng
CREATE TABLE vaccinations (
    vaccination_id BIGSERIAL PRIMARY KEY,
    pet_id         BIGINT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    given_date     DATE,
    due_date       DATE,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_vacc_pet ON vaccinations(pet_id);

-- Lịch sử khám thú y
CREATE TABLE vet_visits (
    visit_id   BIGSERIAL PRIMARY KEY,
    pet_id     BIGINT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    vet_name   VARCHAR(100),
    clinic     VARCHAR(150),
    note       VARCHAR(300),
    visit_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_visit_pet ON vet_visits(pet_id);
