-- Passport demo cho Bobby (owner 10)
UPDATE pets SET
  eye_color = 'Brown',
  color = 'Tri-color (Tan, White, Sable)',
  neutered = true,
  neutered_date = DATE '2023-04-10',
  diet = 'Dry kibble',
  implant_date = DATE '2023-04-05',
  implant_location = 'Left neck area',
  birth_date = DATE '2023-03-12',
  diet = 'Dry kibble',
  blood_type = 'DEA 1.1+',
  medications = 'Flea prevention'
WHERE owner_id = 10 AND name = 'Bobby';

-- Xoá dữ liệu cũ để chạy lại an toàn
DELETE FROM vaccinations WHERE pet_id IN (SELECT pet_id FROM pets WHERE owner_id=10 AND name='Bobby');
DELETE FROM vet_visits   WHERE pet_id IN (SELECT pet_id FROM pets WHERE owner_id=10 AND name='Bobby');

INSERT INTO vaccinations (pet_id, name, given_date, due_date)
SELECT pet_id, x.name, x.given, x.due FROM pets p,
  (VALUES
    ('Rabies',        DATE '2025-01-15', DATE '2026-01-15'),
    ('DHPP Combo',    DATE '2025-03-10', DATE '2026-03-10'),
    ('Bordetella',    DATE '2024-06-20', DATE '2025-06-20'),
    ('Leptospirosis', DATE '2025-01-15', DATE '2026-01-15')
  ) AS x(name, given, due)
WHERE p.owner_id=10 AND p.name='Bobby';

INSERT INTO vet_visits (pet_id, vet_name, clinic, note, visit_date)
SELECT pet_id, x.vet, x.clinic, x.note, x.d FROM pets p,
  (VALUES
    ('Dr. Linh Pham', 'Happy Paws Clinic', 'Annual checkup, all clear',   DATE '2025-03-15'),
    ('Dr. Minh Tran', 'Pet Care Center',   'Vaccination booster shots',   DATE '2025-01-15'),
    ('Dr. Linh Pham', 'Happy Paws Clinic', 'Minor ear infection, treated', DATE '2024-10-05')
  ) AS x(vet, clinic, note, d)
WHERE p.owner_id=10 AND p.name='Bobby';
