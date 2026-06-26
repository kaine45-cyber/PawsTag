# 🐾 PawsTag — Backend v3 (đã khớp với frontend thật)

Bản này reconcile spec backend với frontend đang chạy. Nguyên tắc: **frontend đã dựng = nguồn chuẩn → backend mở rộng để phục vụ**; giữ lại các thiết kế an toàn của backend (mã ngẫu nhiên, batch/activate).

> Quy ước chống lệch về sau: coi **OpenAPI (Swagger)** là hợp đồng chung. Frontend sinh type từ đó.

---

## 1. Ba quyết định thiết kế quan trọng

1. **Tag tách 2 khái niệm:**
   - `public_code` ngẫu nhiên (A8K92X) — nằm trong URL quét, chống đoán. KHÔNG dùng "PAWS-BBY-2026" ở đây.
   - `label` ("PAWS-BBY-2026") — chỉ là tên hiển thị cho owner, không công khai.
2. **Liên hệ khẩn cấp = bảng riêng** `emergency_contacts` (1 pet có N liên hệ, sắp theo `priority`) — không nhồi vào cột pets.
3. **`location_name` nullable** — luôn lưu lat/long; reverse-geocode ra tên để sau.

---

## 2. Schema DB (PostgreSQL) — đã mở rộng

```sql
-- V1__create_owner.sql
CREATE TABLE owners (
    owner_id      BIGSERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,    -- ⭐ khóa đăng nhập
    phone         VARCHAR(20),                     -- liên hệ, không bắt buộc unique
    password_hash VARCHAR(255),                    -- nullable nếu đăng nhập Google
    full_name     VARCHAR(100),
    auth_provider VARCHAR(20) DEFAULT 'LOCAL',     -- LOCAL / GOOGLE (chừa chỗ OAuth)
    google_id     VARCHAR(100),
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now()
);

-- V2__create_pet.sql
CREATE TABLE pets (
    pet_id               BIGSERIAL PRIMARY KEY,
    owner_id             BIGINT NOT NULL REFERENCES owners(owner_id),
    -- thông tin cơ bản
    name                 VARCHAR(100) NOT NULL,
    type                 VARCHAR(50),               -- dog / cat / ...
    breed                VARCHAR(100),
    color                VARCHAR(50),
    age                  INT,
    weight               NUMERIC(5,2),
    gender               VARCHAR(20),
    collar               VARCHAR(150),
    -- y tế
    vaccinated           BOOLEAN DEFAULT false,
    allergies            TEXT,
    medical_info         TEXT,
    identification_notes TEXT,
    emergency_message    TEXT,
    photo_url            VARCHAR(500),              -- URL ảnh ở Cloud Storage
    -- trạng thái pet
    status               VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE / ARCHIVED
    -- privacy (áp dụng phía SERVER khi trả public)
    show_phone           BOOLEAN DEFAULT true,
    show_owner_name      BOOLEAN DEFAULT true,
    show_location        BOOLEAN DEFAULT true,
    -- lost mode
    is_lost              BOOLEAN DEFAULT false,
    lost_message         TEXT,
    reward_amount        NUMERIC(12,2),
    lost_since           TIMESTAMP,
    created_at           TIMESTAMP DEFAULT now(),
    updated_at           TIMESTAMP DEFAULT now()
);

-- V3__create_emergency_contact.sql   ⭐ MỚI (liên hệ khẩn cấp có thứ tự)
CREATE TABLE emergency_contacts (
    contact_id   BIGSERIAL PRIMARY KEY,
    pet_id       BIGINT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    name         VARCHAR(100),
    phone        VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    priority     INT NOT NULL DEFAULT 1,            -- thứ tự liên hệ
    created_at   TIMESTAMP DEFAULT now()
);

-- V4__create_tag.sql
CREATE TABLE tags (
    tag_id       BIGSERIAL PRIMARY KEY,
    public_code  VARCHAR(20) UNIQUE NOT NULL,       -- ngẫu nhiên, nằm trong URL quét
    label        VARCHAR(50),                       -- ⭐ tên hiển thị (PAWS-BBY-2026)
    pet_id       BIGINT REFERENCES pets(pet_id),    -- NULLABLE: null = chưa gán
    status       VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED',  -- UNASSIGNED / ACTIVE
    type         VARCHAR(10) NOT NULL DEFAULT 'QR', -- QR / NFC
    nfc_linked   BOOLEAN DEFAULT false,             -- ⭐ đã ghi vào chip NFC chưa
    created_at   TIMESTAMP DEFAULT now(),
    activated_at TIMESTAMP
);
CREATE INDEX idx_tags_public_code ON tags(public_code);

-- V5__create_scan_log.sql
CREATE TABLE scan_logs (
    scan_id       BIGSERIAL PRIMARY KEY,
    tag_id        BIGINT NOT NULL REFERENCES tags(tag_id),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    location_name VARCHAR(200),                     -- ⭐ nullable, reverse-geocode sau
    user_agent    VARCHAR(300),                     -- ⭐ thiết bị quét
    device_type   VARCHAR(50),                      -- ⭐ mobile / desktop
    scanned_at    TIMESTAMP DEFAULT now()
);

-- V6__create_notification.sql        ⭐ MỚI
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES owners(owner_id),
    pet_id          BIGINT REFERENCES pets(pet_id),
    type            VARCHAR(50),                    -- SCAN / LOST / SYSTEM
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT now()
);
```

**Quan hệ:** Owner 1–N Pet · Pet 1–N EmergencyContact · Pet 1–1 Tag (tag tồn tại trước, pet_id nullable) · Tag 1–N ScanLog · Owner 1–N Notification

---

## 3. Cần thêm vào cấu trúc thư mục (so với v2)

```
entity/
├── EmergencyContact.java     ⭐ MỚI
└── Notification.java         ⭐ MỚI

repository/
├── EmergencyContactRepository.java   ⭐ MỚI
└── NotificationRepository.java       ⭐ MỚI

service/ + service/impl/
└── (NotificationService đã có; bổ sung logic emergency contacts vào PetService)

enums/
├── TagStatus.java      # UNASSIGNED, ACTIVE
├── TagType.java        # QR, NFC
├── PetStatus.java      # ACTIVE, ARCHIVED
├── AuthProvider.java   # LOCAL, GOOGLE
└── NotificationType.java

dto/request/
├── RegisterRequest.java     # fullName, email, phone, password
├── LoginRequest.java        # email, password
├── GoogleAuthRequest.java   # ⭐ idToken (Phase sau)
├── PetRequest.java          # đầy đủ field mới + list emergencyContacts
├── LostModeRequest.java     # ⭐ isLost, lostMessage, rewardAmount
├── BatchTagRequest.java     # quantity
├── ActivateTagRequest.java  # publicCode, petId
└── ScanRequest.java         # publicCode, lat, long, userAgent

dto/response/
├── AuthResponse.java
├── DashboardResponse.java   # ⭐ stats + pets + recentScans
├── PetResponse.java         # owner view đầy đủ
├── PublicPetResponse.java   # ⭐ đã LỌC theo privacy flags
├── PublicScanResponse.java  # { status, pet|null }
├── TagResponse.java         # public_code, label, status, nfcLinked
├── BatchTagResponse.java
├── ScanLogResponse.java     # nhóm theo ngày
├── NotificationResponse.java
└── ApiResponse.java
```

---

## 4. API map theo từng màn frontend

```
# ===== Công khai =====
POST   /api/auth/register             # fullName, email, phone, password
POST   /api/auth/login                # email, password → JWT
POST   /api/auth/google               # ⏳ Phase sau — để stub, chừa chỗ

GET    /api/public/t/{code}           # PublicScanResponse, ĐÃ lọc theo privacy flags
POST   /api/scans                     # publicCode + lat/long + userAgent

# ===== Cần đăng nhập =====
GET    /api/dashboard                 # stats{totalPets,activeTags,scansToday,lostModeActive} + pets + 3 scan gần nhất

POST   /api/pets                      # tạo pet (+ tùy chọn auto-cấp 1 tag)
GET    /api/pets/{id}                 # owner view đầy đủ
PUT    /api/pets/{id}                 # sửa
DELETE /api/pets/{id}
PUT    /api/pets/{id}/lost-mode       # bật/tắt + lostMessage + reward

GET    /api/tags/mine
POST   /api/tags/batch                # (ADMIN) sinh N mã trống để in
POST   /api/tags/activate             # gán publicCode vào pet
POST   /api/tags/{id}/nfc             # đánh dấu nfc_linked = true

GET    /api/scans/history?petId=      # nhóm theo ngày

GET    /api/notifications
PATCH  /api/notifications/{id}/read
```

**Phân quyền (`SecurityConfig`):**
- `permitAll()` → `/api/auth/**`, `/api/public/**`, `POST /api/scans`
- `hasRole('ADMIN')` → `POST /api/tags/batch`
- `authenticated()` → tất cả còn lại

---

## 5. Hai điểm dễ sai khi code (đọc kỹ)

**⚠ Privacy phải lọc phía SERVER, không phải ẩn ở frontend.**
Khi build `PublicScanResponse`, nếu `show_phone = false` thì **backend không được đưa số điện thoại vào JSON**. Nếu cứ gửi hết rồi để frontend "ẩn", thì ai mở DevTools cũng thấy → lộ dữ liệu. Privacy = lọc ở server.

**⚡ Hỗ trợ cả 2 luồng tạo tag (dùng chung bảng `tags`):**
- `generateBatch()` — shop sinh sẵn mã trống (UNASSIGNED) để in tag vật lý → khách `activate` sau.
- `createForPet()` — khi tạo pet, auto sinh 1 tag mới gán luôn (ACTIVE) cho luồng digital-first ở `pet/create`.
Cả hai chỉ là 2 cách tạo dòng trong cùng bảng `tags`.

---

## 6. Việc cần làm theo thứ tự

1. Cập nhật migration V1–V6 (schema mới ở trên)
2. Sửa entity + thêm `EmergencyContact`, `Notification`, các `enums`
3. Sửa DTO cho khớp field frontend (đặc biệt `RegisterRequest`, `PetRequest`, `PublicPetResponse`)
4. `AuthController` login bằng **email**; stub `/api/auth/google` (chưa làm thật)
5. `PublicController` lọc privacy + phân biệt UNASSIGNED/ACTIVE
6. `TagService` làm cả `batch` + `activate` + `createForPet`
7. Bật Swagger → đưa link OpenAPI cho frontend sinh type
