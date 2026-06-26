-- Thông báo demo phong phú cho owner 10 (loc@gmail.com)
DELETE FROM notifications WHERE owner_id = 10;

INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at)
SELECT 10, b.pet_id, x.type, x.title, x.msg, x.is_read, now() - x.ago
FROM (SELECT pet_id FROM pets WHERE owner_id=10 AND name='Bobby') b,
     (SELECT pet_id FROM pets WHERE owner_id=10 AND name='Luna')  l,
     (VALUES
       ('SCAN',     'Bobby''s tag was scanned!', 'Someone scanned Bobby''s QR tag at Hoan Kiem District, Hanoi', false, INTERVAL '10 minutes'),
       ('SCAN',     'Bobby scanned again',       'Tag scanned by Tran Van Nam at Dong Da District',            false, INTERVAL '2 hours'),
       ('SYSTEM',   '🔔 Daily Summary',          'Bobby received 3 scans today across 2 different locations.',  true,  INTERVAL '6 hours'),
       ('SCAN',     'Bobby''s tag was scanned!', 'Bobby''s QR code was scanned at Old Quarter, Hanoi',          true,  INTERVAL '4 days')
     ) AS x(type, title, msg, is_read, ago);

-- Luna NFC (pet Luna)
INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at)
SELECT 10, pet_id, 'LOCATION', 'Luna''s NFC was tapped!', 'Luna''s NFC tag was tapped at Cau Giay Park yesterday', true, now() - INTERVAL '1 day'
FROM pets WHERE owner_id=10 AND name='Luna';

-- Không gắn pet (hiện icon emoji)
INSERT INTO notifications (owner_id, pet_id, type, title, message, is_read, created_at) VALUES
  (10, NULL, 'SYSTEM', '🐾 Profile Tip',     'Add Bobby''s vaccination record to complete his Pet Passport and earn a ✅ badge.', true, now() - INTERVAL '2 days'),
  (10, NULL, 'SYSTEM', 'NFC Tag Delivered!', 'Your PawsTag NFC sticker order has been delivered. Tap to program it now.',         true, now() - INTERVAL '3 days');
