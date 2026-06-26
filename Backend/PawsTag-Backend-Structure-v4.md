# 🐾 PawsTag — Backend v4 (khớp frontend, vòng 2 — bản hoàn chỉnh)

Bổ sung các field frontend đang render mà v3 còn thiếu (y tế, contact_phone, avatar, city), đổi `age` → `birth_date`, sửa `NotificationType`, và làm rõ field nào **lưu** vs field nào **tính ra**.

> Bản này đã đóng nốt 4 điểm còn hở sau khi đối chiếu frontend thật: `conditions`, `totalScans` ở dashboard, `alert_radius_km` cho lost-mode, và Facebook auth.

---

## 1. Quyết định thiết kế (vòng này)

| Vấn đề | Cách làm |
|---|---|
| Tuổi pet | Lưu `birth_date` (DATE) làm chuẩn. **Bỏ cột `age`**. Chuỗi "2 years" **tính trong DTO**. |
| Số "Call Owner" | Dùng `pets.contact_phone` (nhập lúc tạo pet, bị `show_phone` kiểm soát). KHÔNG dùng `owners.phone`. |
| 3 nguồn phone | `owners.phone` (tài khoản, nullable) · `pets.contact_phone` (chính, trên tag) · `emergency_contacts[]` (dự phòng có thứ tự) |
| safe / lost | Suy từ `is_lost`. **Bỏ cột `status` (ACTIVE/ARCHIVED)** nếu FE không dùng. |
| Field tính ra (KHÔNG lưu) | `age` (từ birth_date) · `tagCode` (join tags) · `scansToday`/`totalScans` (count scan_logs) |
| NotificationType | SCAN, LOCATION, MEDICAL, ALERT, SYSTEM (theo FE) |
| RegisterRequest.phone | Nullable — form register không thu phone |
| **Tình trạng y tế (`conditions`)** | ⭐ Cột **riêng** `conditions TEXT` (FE render `pet.medical.conditions` ở pet detail + public scan). `medical_info` để ghi chú tự do khác. |
| **Alert radius (lost mode)** | ⭐ Lưu `alert_radius_km INT DEFAULT 5` trên pets; nhận trong `LostModeRequest`. Việc đẩy thông báo theo bán kính = Phase sau. |
| **Facebook login** | ⭐ Thêm `FACEBOOK` vào `AuthProvider`; stub `POST /api/auth/facebook` song song Google (Phase sau làm thật). |

---

## 2. Schema DB — các bảng đổi

```sql
-- V1__create_owner.sql
CREATE TABLE owners (
    owner_id      BIGSERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,    -- khóa đăng nhập
    phone         VARCHAR(20),                     -- ⭐ nullable (register không thu)
    password_hash VARCHAR(255),                    -- nullable nếu login Google/Facebook
    full_name     VARCHAR(100),
    avatar_url    VARCHAR(500),                    -- ⭐ MỚI (dashboard avatar)
    city          VARCHAR(100),                    -- ⭐ MỚI (profile sửa city)
    auth_provider VARCHAR(20) DEFAULT 'LOCAL',     -- LOCAL / GOOGLE / FACEBOOK
    google_id     VARCHAR(100),
    facebook_id   VARCHAR(100),                    -- ⭐ MỚI (chừa chỗ Facebook)
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now()
);

-- V2__create_pet.sql
CREATE TABLE pets (
    pet_id               BIGSERIAL PRIMARY KEY,
    owner_id             BIGINT NOT NULL REFERENCES owners(owner_id),
    -- cơ bản
    name                 VARCHAR(100) NOT NULL,
    type                 VARCHAR(50),
    breed                VARCHAR(100),
    color                VARCHAR(50),
    birth_date           DATE,                      -- ⭐ thay cho age; age tính trong DTO
    weight               NUMERIC(5,2),
    gender               VARCHAR(20),
    collar               VARCHAR(150),
    contact_phone        VARCHAR(20),               -- ⭐ MỚI: số "Call Owner" trên tag
    -- y tế
    vaccinated           BOOLEAN DEFAULT false,
    blood_type           VARCHAR(10),               -- ⭐ MỚI
    microchip_id         VARCHAR(50),               -- ⭐ MỚI
    allergies            TEXT,
    conditions           TEXT,                      -- ⭐ MỚI (pet.medical.conditions)
    medications          TEXT,                      -- ⭐ MỚI
    last_vet_visit       DATE,                      -- ⭐ MỚI
    vet_name             VARCHAR(100),              -- ⭐ MỚI
    vet_phone            VARCHAR(20),               -- ⭐ MỚI
    medical_info         TEXT,                      -- ghi chú y tế tự do khác
    identification_notes TEXT,
    emergency_message    TEXT,
    photo_url            VARCHAR(500),
    -- privacy (lọc phía SERVER)
    show_phone           BOOLEAN DEFAULT true,
    show_owner_name      BOOLEAN DEFAULT true,
    show_location        BOOLEAN DEFAULT true,
    -- lost mode (safe/lost suy từ is_lost)
    is_lost              BOOLEAN DEFAULT false,
    lost_message         TEXT,
    reward_amount        NUMERIC(12,2),
    alert_radius_km      INT DEFAULT 5,             -- ⭐ MỚI (slider 1–20km ở lost-mode)
    lost_since           TIMESTAMP,
    created_at           TIMESTAMP DEFAULT now(),
    updated_at           TIMESTAMP DEFAULT now()
    -- ✗ KHÔNG có cột age; ✗ bỏ status ACTIVE/ARCHIVED (trừ khi cần xóa mềm)
);

-- V3__create_emergency_contact.sql  (giữ nguyên v3)
CREATE TABLE emergency_contacts (
    contact_id   BIGSERIAL PRIMARY KEY,
    pet_id       BIGINT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    name         VARCHAR(100),
    phone        VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    priority     INT NOT NULL DEFAULT 1,
    created_at   TIMESTAMP DEFAULT now()
);

-- V4__create_tag.sql  (giữ nguyên v3)
CREATE TABLE tags (
    tag_id       BIGSERIAL PRIMARY KEY,
    public_code  VARCHAR(20) UNIQUE NOT NULL,       -- ngẫu nhiên, nằm trong URL quét
    label        VARCHAR(50),                       -- tên hiển thị (PAWS-BBY-2026)
    pet_id       BIGINT REFERENCES pets(pet_id),    -- NULLABLE: null = chưa gán
    status       VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED',  -- UNASSIGNED / ACTIVE
    type         VARCHAR(10) NOT NULL DEFAULT 'QR', -- QR / NFC
    nfc_linked   BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT now(),
    activated_at TIMESTAMP
);
CREATE INDEX idx_tags_public_code ON tags(public_code);

-- V5__create_scan_log.sql  (giữ nguyên v3)
CREATE TABLE scan_logs (
    scan_id       BIGSERIAL PRIMARY KEY,
    tag_id        BIGINT NOT NULL REFERENCES tags(tag_id),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    location_name VARCHAR(200),                     -- nullable, reverse-geocode sau
    user_agent    VARCHAR(300),
    device_type   VARCHAR(50),                      -- mobile / desktop
    scanned_at    TIMESTAMP DEFAULT now()
);

-- V6__create_notification.sql  (type theo FE)
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES owners(owner_id),
    pet_id          BIGINT REFERENCES pets(pet_id),
    type            VARCHAR(20),                    -- SCAN / LOCATION / MEDICAL / ALERT / SYSTEM
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT now()
);
```

**Quan hệ:** Owner 1–N Pet · Pet 1–N EmergencyContact · Pet 1–1 Tag (tag tồn tại trước, pet_id nullable) · Tag 1–N ScanLog · Owner 1–N Notification

---

## 3. Field "tính ra" — xử lý trong DTO/query, KHÔNG lưu

```
age            → tính từ birth_date trong PetMapper:
                 "2 years" / "8 months" (chuỗi cho UI)

tagCode        → join: lấy tag của pet (Pet 1–1 Tag),
                 trả public_code (URL) + label (hiển thị)

scansToday     → scanLogRepository.countByPetAndScannedAtAfter(startOfToday)
totalScans     → scanLogRepository.count() theo owner/pet (all-time)
lostModeActive → đếm pets WHERE is_lost = true
activeTags     → đếm tags WHERE status = 'ACTIVE' theo owner
```

`DashboardResponse` = `{ stats:{ totalPets, activeTags, scansToday, totalScans, lostModeActive }, pets:[...], recentScans:[3] }`
> ⭐ `totalScans` (all-time) đã thêm vào stats — card "Total Scans" ở dashboard FE cần nó.

---

## 4. Enums (cập nhật)

```
TagStatus         : UNASSIGNED, ACTIVE
TagType           : QR, NFC
AuthProvider      : LOCAL, GOOGLE, FACEBOOK            ⭐ thêm FACEBOOK
NotificationType  : SCAN, LOCATION, MEDICAL, ALERT, SYSTEM   ⭐ khớp FE
PetGender         : MALE, FEMALE, UNKNOWN   (tùy chọn)
```

---

## 5. DTO cần khớp field mới

```
RegisterRequest   : fullName, email, password, phone? (nullable)
LoginRequest      : email, password
GoogleAuthRequest : idToken            (Phase sau)
FacebookAuthRequest : accessToken      ⭐ (Phase sau, stub)

PetRequest        : name, type, breed, color, birthDate, weight, gender, collar,
                      contactPhone, bloodType, microchipId, allergies, conditions,
                      medications, lastVetVisit, vetName, vetPhone, emergencyMessage,
                      + emergencyContacts:[{name,phone,relationship,priority}]
LostModeRequest   : isLost, lostMessage, rewardAmount, alertRadiusKm   ⭐ thêm radius

PetResponse       : + age (tính), tagCode (join), tất cả field y tế (gồm conditions),
                      status = (isLost ? "lost" : "safe"), scansToday, totalScans
PublicPetResponse : ảnh, tên, lời nhắn, field y tế (blood_type, microchip, allergies,
                      conditions, medications...), nút liên hệ →
                      LỌC contact_phone/owner_name/location theo privacy flags
DashboardResponse : stats{ totalPets, activeTags, scansToday, totalScans, lostModeActive }
                      + pets[] + recentScans[3]
NotificationResponse : id, type, message, isRead, createdAt
ApiResponse<T>    : { success, data, message }
```

---

## 6. Lưu ý khi code (nhắc lại 2 cái quan trọng nhất)

1. **Privacy lọc ở SERVER.** `show_phone = false` → backend KHÔNG đưa `contact_phone` vào `PublicPetResponse`. Đừng gửi rồi ẩn ở FE (lộ qua DevTools).
2. **`age`, `tagCode`, `scansToday`, `totalScans` là tính ra**, không phải cột. Đừng tạo cột → sai nguồn dữ liệu.

---

## 7. Việc cần làm

1. Migration: thêm cột owners (avatar_url, city, facebook_id), pets (contact_phone + 7 field y tế gồm `conditions` + birth_date + alert_radius_km, bỏ age/status)
2. Sửa `NotificationType` enum theo FE; thêm `FACEBOOK` vào `AuthProvider`
3. `PetMapper`: tính `age` từ `birth_date`, ghép `tagCode`, map `is_lost` → "safe"/"lost", aggregate scansToday/totalScans
4. `PublicPetResponse`: thêm field y tế (gồm conditions), lọc privacy ở server
5. `DashboardResponse`: query count cho scansToday/**totalScans**/activeTags/lostModeActive
6. `LostModeRequest`: nhận `alertRadiusKm`; `RegisterRequest.phone` optional
7. Stub `POST /api/auth/google` + `POST /api/auth/facebook` (chừa chỗ OAuth)

---

## 8. Trạng thái còn lại (deferred — Phase 6)

| Hạng mục | Ghi chú |
|---|---|
| Đẩy thông báo theo `alert_radius_km` | Giá trị đã lưu; logic broadcast làm sau |
| Google/Facebook OAuth thật | Hiện chỉ stub endpoint |
| Upload ảnh (`photo_url`, `avatar_url`) | Cần endpoint upload / presigned URL |
| Reverse-geocode → `location_name` | Hiện luôn lưu lat/lng |
