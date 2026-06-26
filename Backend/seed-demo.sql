-- Seed dữ liệu demo cho owner loc@gmail.com (owner_id = 10)
-- Idempotent: chỉ chèn nếu chưa có pet cùng tên.

-- ── Pets ──
INSERT INTO pets (owner_id, name, type, breed, color, birth_date, weight, gender,
                  contact_phone, vaccinated, blood_type, microchip_id, allergies,
                  conditions, last_vet_visit, vet_name, vet_phone, emergency_message,
                  photo_url, show_phone, show_owner_name, show_location,
                  is_lost, alert_radius_km, created_at, updated_at)
SELECT 10, 'Bobby', 'dog', 'Pembroke Welsh Corgi', 'Brown & White', DATE '2023-03-15', 12.5, 'male',
       '+84912345678', true, 'DEA 1.1+', '985141007548723', 'None',
       'Healthy, fully vaccinated', DATE '2026-05-10', 'Dr. Minh Tuan', '+84908123456',
       'Bobby is very friendly! Please call me right away. He loves treats.',
       'https://images.unsplash.com/photo-1612940960267-77571294d37f?w=800&q=80',
       true, true, true, false, 5, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE owner_id=10 AND name='Bobby');

INSERT INTO pets (owner_id, name, type, breed, color, birth_date, weight, gender,
                  contact_phone, vaccinated, blood_type, microchip_id, allergies,
                  conditions, last_vet_visit, vet_name, vet_phone, emergency_message,
                  photo_url, show_phone, show_owner_name, show_location,
                  is_lost, lost_message, reward_amount, alert_radius_km, lost_since, created_at, updated_at)
SELECT 10, 'Luna', 'dog', 'Golden Retriever', 'Golden', DATE '2025-01-20', 25.0, 'female',
       '+84912345678', true, 'DEA 1.1-', '985141007548724', 'Pollen (mild)',
       'Healthy', DATE '2026-04-22', 'Dr. Minh Tuan', '+84908123456',
       'Luna is friendly and loves people. Please contact me immediately!',
       'https://images.unsplash.com/photo-1602241628512-1a66af5f3b00?w=800&q=80',
       true, true, true, true, 'Luna went missing near Thu Duc City. Reward offered!', 2000000, 10, now() - interval '3 hours', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE owner_id=10 AND name='Luna');

-- ── Tags (ACTIVE) ──
INSERT INTO tags (public_code, pet_id, status, type, nfc_linked, created_at, activated_at)
SELECT 'BOBBY1', p.pet_id, 'ACTIVE', 'QR', true, now(), now()
FROM pets p WHERE p.owner_id=10 AND p.name='Bobby'
  AND NOT EXISTS (SELECT 1 FROM tags WHERE public_code='BOBBY1');

INSERT INTO tags (public_code, pet_id, status, type, nfc_linked, created_at, activated_at)
SELECT 'LUNA22', p.pet_id, 'ACTIVE', 'QR', false, now(), now()
FROM pets p WHERE p.owner_id=10 AND p.name='Luna'
  AND NOT EXISTS (SELECT 1 FROM tags WHERE public_code='LUNA22');

-- ── Scan logs ──
INSERT INTO scan_logs (tag_id, latitude, longitude, location_name, user_agent, device_type, scanned_at)
SELECT t.tag_id, 13.7765, 109.2237, 'Quy Nhon Beach, Binh Dinh', 'iPhone Safari', 'mobile', now() - interval '5 minutes'
FROM tags t WHERE t.public_code='BOBBY1'
  AND NOT EXISTS (SELECT 1 FROM scan_logs s WHERE s.tag_id=t.tag_id AND s.location_name='Quy Nhon Beach, Binh Dinh');

INSERT INTO scan_logs (tag_id, latitude, longitude, location_name, user_agent, device_type, scanned_at)
SELECT t.tag_id, 10.7769, 106.7009, 'Nguyen Hue Street, HCMC', 'Chrome Desktop', 'desktop', now() - interval '1 day'
FROM tags t WHERE t.public_code='BOBBY1'
  AND NOT EXISTS (SELECT 1 FROM scan_logs s WHERE s.tag_id=t.tag_id AND s.location_name='Nguyen Hue Street, HCMC');

INSERT INTO scan_logs (tag_id, latitude, longitude, location_name, user_agent, device_type, scanned_at)
SELECT t.tag_id, 10.8458, 106.7755, 'Thu Duc City, HCMC', 'Android Chrome', 'mobile', now() - interval '3 hours'
FROM tags t WHERE t.public_code='LUNA22'
  AND NOT EXISTS (SELECT 1 FROM scan_logs s WHERE s.tag_id=t.tag_id AND s.location_name='Thu Duc City, HCMC');

-- ── Notifications ──
INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at)
SELECT 10, p.pet_id, 'SCAN', 'Bobby was scanned!', 'Someone found Bobby at Quy Nhon Beach, Binh Dinh.', false, now() - interval '5 minutes'
FROM pets p WHERE p.owner_id=10 AND p.name='Bobby'
  AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.owner_id=10 AND n.title='Bobby was scanned!');

INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at)
SELECT 10, p.pet_id, 'LOCATION', 'Location shared', 'A finder shared their location for Luna near Thu Duc City.', false, now() - interval '3 hours'
FROM pets p WHERE p.owner_id=10 AND p.name='Luna'
  AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.owner_id=10 AND n.title='Location shared');

INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at)
SELECT 10, NULL, 'SYSTEM', 'Welcome to PawsTag!', 'Your account is set up. Two demo pets have been added.', true, now() - interval '2 days'
WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.owner_id=10 AND n.title='Welcome to PawsTag!');
