# 🐾 PawsTag Backend — Kế hoạch phát triển

> Tài liệu này được lập sau khi **đọc toàn bộ code frontend thật** (`Frontend/pawtag-web/src`) và đối chiếu với spec backend.
> **Spec chuẩn hiện tại: `PawsTag-Backend-Structure-v4.md`** (v3 giữ lại để tham khảo lịch sử). v4 đã đóng nốt các field còn hở so với frontend.
> Mục tiêu: backend phục vụ đúng hợp đồng dữ liệu mà frontend đang dùng, không lệch field.

**Stack chốt:** Spring Boot 3.3+ · Java 21 · Maven · Spring Web · Spring Data JPA · Spring Security + JWT (jjwt) · PostgreSQL · Flyway · springdoc-openapi (Swagger) · Lombok · Bean Validation.
**Contract chung:** OpenAPI/Swagger. Frontend `lib/axios.ts` mặc định gọi `http://localhost:8080/api`.

---

## 0. Đối chiếu Frontend thật ↔ Spec (PHẢI đọc trước khi code)

> ✅ **Tất cả gap ❌/⚠️ trong mục này ĐÃ ĐƯỢC ĐÓNG trong `PawsTag-Backend-Structure-v4.md`.** Giữ bảng lại làm hồ sơ phân tích — khi code thì theo schema v4.

Spec v3 nhìn chung khớp, nhưng frontend đang render một số field mà schema v3 **chưa có**. Bảng dưới là nguồn chuẩn để sửa schema/DTO (đã phản ánh vào v4).

### 0.1 Owner (frontend `types/owner.ts`)
Frontend: `{ id, name, email, phone, avatar, city }`

| Field FE | Cột v3 | Trạng thái |
|----------|--------|-----------|
| name | full_name | ✅ map tên |
| email | email | ✅ |
| phone | phone | ✅ |
| **avatar** | — | ❌ **THIẾU** → thêm `avatar_url VARCHAR(500)` |
| **city** | — | ❌ **THIẾU** → thêm `city VARCHAR(100)` (profile page cho sửa city) |

### 0.2 Pet (frontend `types/pet.ts`)
Frontend: `{ id, ownerId, name, species, breed, gender, birthDate, age, weight, color, photo, status, tagCode, phone, emergencyMessage, scansToday, totalScans, medical{…} }`

| Field FE | Cột v3 | Trạng thái / Xử lý |
|----------|--------|--------------------|
| species | type | ✅ map (FE: dog/cat/rabbit/bird/other) |
| birthDate | — | ⚠️ v3 chỉ có `age INT`. FE có `birthDate` ("2023-03-15"). → **thêm `birth_date DATE`**; `age` để DTO tự tính ra chuỗi "2 years" |
| age (string "2 years") | age INT | ⚠️ FE hiển thị chuỗi; form create gửi free text. → DTO trả `age` dạng **string** (tính từ birth_date) |
| weight (string "12.5 kg") | weight NUMERIC | ✅ lưu số, DTO format |
| **status** ("safe"/"lost") | is_lost (bool) | ✅ **không** map vào `status` cột (đó là ACTIVE/ARCHIVED). DTO: `status = is_lost ? "lost" : "safe"` |
| **tagCode** ("A8K92X") | tags.public_code | ✅ join tag ACTIVE của pet → expose `tagCode` |
| **phone** (số trên thẻ) | — | ❌ **THIẾU**. FE dùng `pet.phone` cho nút "Call Owner" ở trang public + lost-mode + pet detail. → **Quyết định cần chốt** (xem §6): thêm `contact_phone` vào pets HOẶC suy ra từ emergency_contact ưu tiên cao nhất / owner.phone |
| emergencyMessage | emergency_message | ✅ |
| scansToday | (tính từ scan_logs) | ✅ aggregate trong DTO |
| totalScans | (tính từ scan_logs) | ✅ aggregate trong DTO |

**Medical (`pet.medical`)** — FE render: allergies, conditions, bloodType, microchipId, lastVetVisit (+ medications, vetName, vetPhone trong type):

| Field FE | Cột v3 | Trạng thái |
|----------|--------|-----------|
| allergies | allergies | ✅ |
| conditions | medical_info? | ⚠️ map tạm hoặc thêm `conditions TEXT` |
| **bloodType** | — | ❌ **THIẾU** → `blood_type VARCHAR(20)` (hiện ở trang public scan) |
| **microchipId** | — | ❌ **THIẾU** → `microchip_id VARCHAR(50)` (hiện ở public scan + pet detail) |
| **lastVetVisit** | — | ❌ **THIẾU** → `last_vet_visit DATE` |
| **medications** | — | ❌ **THIẾU** → `medications TEXT` |
| **vetName / vetPhone** | — | ❌ **THIẾU** → `vet_name`, `vet_phone` |

→ Gom các field y tế vào pets (đơn giản) **hoặc** tách bảng `pet_medical` 1–1. Khuyến nghị: thêm thẳng vào `pets` cho gọn ở giai đoạn này.

### 0.3 Notification — enum lệch
- FE `types/response.ts`: `"scan" | "location" | "medical" | "system"`
- FE `notifications/page.tsx`: `"scan" | "location" | "alert" | "system"`
- Spec v3: `SCAN / LOST / SYSTEM`

→ **Thống nhất `NotificationType`** = `SCAN, LOCATION, LOST, MEDICAL, SYSTEM` (gộp "alert" ≈ LOST). Frontend nên dùng đúng 1 bộ enum này khi nối API.

### 0.4 Auth
- **register**: form FE chỉ thu `name, email, password` (KHÔNG có phone). → `RegisterRequest.phone` để **nullable**.
- **login**: email + password ✅.
- **Facebook**: FE có nút Facebook (cả login + register), spec v3 chỉ stub Google. → Quyết định: thêm stub Facebook hay coi nút này là trang trí (Phase sau). Tạm thời để Phase sau.

### 0.5 Các điểm nhỏ khác
- **Lost mode**: FE có slider `radius` (1–20km) — v3 `LostModeRequest` chưa có. → optional `alert_radius_km INT`, hoặc bỏ qua giai đoạn đầu.
- **Dashboard stats**: FE tính `totalScans` (tổng), `pets.length`, `scannedToday`. v3 `DashboardResponse` có `totalPets, activeTags, scansToday, lostModeActive`. → DTO nên trả đủ cả `totalScans` để FE khỏi sửa.
- **Upload ảnh**: `pet/create` có upload ảnh (JPG/PNG ≤5MB). v3 dùng `photo_url` (Cloud Storage) nhưng API map chưa có endpoint upload. → thêm ở Phase sau (xem §5 Phase 6).
- **NFC**: route FE `/n/{code}` redirect sang `/t/{code}`; backend chỉ cần 1 endpoint `GET /api/public/t/{code}`. Toggle NFC ở tags page ↔ `nfc_linked` + `POST /api/tags/{id}/nfc`.

---

## 1. Cấu trúc thư mục dự án (Spring Boot)

```
Backend/
├── PawsTag-Backend-Structure-v3.md
├── BACKEND-DEVELOPMENT-PLAN.md         ← file này
├── pom.xml
├── docker-compose.yml                  # postgres local
└── src/main/
    ├── java/vn/pawstag/
    │   ├── PawsTagApplication.java
    │   ├── config/
    │   │   ├── SecurityConfig.java
    │   │   ├── CorsConfig.java          # allow http://localhost:3000
    │   │   └── OpenApiConfig.java
    │   ├── security/
    │   │   ├── JwtService.java
    │   │   ├── JwtAuthFilter.java
    │   │   └── CustomUserDetailsService.java
    │   ├── controller/
    │   │   ├── AuthController.java
    │   │   ├── DashboardController.java
    │   │   ├── PetController.java
    │   │   ├── TagController.java
    │   │   ├── ScanController.java
    │   │   ├── PublicController.java
    │   │   └── NotificationController.java
    │   ├── service/  (+ impl/)
    │   │   ├── AuthService · PetService · TagService
    │   │   ├── ScanService · NotificationService · DashboardService
    │   ├── repository/
    │   │   ├── OwnerRepository · PetRepository · EmergencyContactRepository
    │   │   ├── TagRepository · ScanLogRepository · NotificationRepository
    │   ├── entity/
    │   │   ├── Owner · Pet · EmergencyContact · Tag · ScanLog · Notification
    │   ├── enums/
    │   │   ├── TagStatus · TagType · PetStatus · AuthProvider · NotificationType
    │   ├── dto/request/   (RegisterRequest, LoginRequest, PetRequest, …)
    │   ├── dto/response/  (AuthResponse, PetResponse, PublicScanResponse, …)
    │   └── exception/
    │       ├── GlobalExceptionHandler.java
    │       └── (NotFound / Unauthorized / BadRequest)
    └── resources/
        ├── application.yml
        └── db/migration/   V1__create_owner.sql … V6__create_notification.sql
```

---

## 2. Lộ trình theo Phase (mỗi phase mở khóa một phần frontend)

### Phase 0 — Bootstrap (nửa ngày)
- [ ] Spring Initializr: Web, JPA, Security, Validation, PostgreSQL, Flyway, Lombok, springdoc.
- [ ] `docker-compose.yml` chạy Postgres 16 local; `application.yml` cấu hình datasource + Flyway.
- [ ] `CorsConfig` cho `http://localhost:3000`; bật Swagger UI tại `/swagger-ui.html`.
- [ ] `GlobalExceptionHandler` trả đúng format `ApiResponse { success, data, message }` (khớp `types/response.ts`).
- **Acceptance:** app chạy, Swagger mở được, Flyway tạo schema rỗng OK.

### Phase 1 — Auth (1–2 ngày)  → mở khóa: `/login`, `/register`
- [ ] Migration **V1** owners (kèm `avatar_url`, `city` đã thêm).
- [ ] Entity `Owner` + enum `AuthProvider`.
- [ ] `JwtService` + `JwtAuthFilter` + `SecurityConfig` (permitAll `/api/auth/**`, `/api/public/**`, `POST /api/scans`).
- [ ] `POST /api/auth/register` (phone nullable) · `POST /api/auth/login` (email+password) → `AuthResponse { token, owner }`.
- [ ] Stub `POST /api/auth/google` trả 501/Not implemented (chừa chỗ).
- **Acceptance:** đăng ký → nhận JWT; gọi endpoint authenticated với token chạy; sai mật khẩu trả 401.
- **FE đổi:** `AuthContext` thay mock `login/register` bằng `authService` thật, lưu token vào `localStorage("pawtag_token")` (đã có `lib/auth.ts`).

### Phase 2 — Pets + Emergency Contacts + Dashboard (2–3 ngày) → mở khóa: `/dashboard`, `/pet`, `/pet/[petId]`, `/pet/create`, `/pet/[petId]/edit`
- [ ] Migration **V2** pets (kèm các cột y tế thiếu + `birth_date` + quyết định `contact_phone` ở §6) và **V3** emergency_contacts.
- [ ] Entity `Pet`, `EmergencyContact` + enum `PetStatus`.
- [ ] `PetService`: CRUD + map DTO (`status = is_lost?…`, `age` tính từ birth_date, gắn `tagCode` từ tag ACTIVE, aggregate `scansToday/totalScans`).
- [ ] `PUT /api/pets/{id}/lost-mode` (isLost, lostMessage, rewardAmount).
- [ ] `GET /api/dashboard` → `DashboardResponse { stats, pets, recentScans[3] }`.
- **Acceptance:** tạo/sửa/xóa pet; dashboard trả đúng stats + 3 scan gần nhất; pet detail có đủ medical + tagCode.

### Phase 3 — Tags (1–2 ngày) → mở khóa: `/pet/[petId]/tags`
- [ ] Migration **V4** tags + index `public_code`.
- [ ] `util/CodeGenerator` sinh `public_code` ngẫu nhiên 6 ký tự (chống đoán, không trùng).
- [ ] `TagService`: `createForPet()` (ACTIVE, gọi khi tạo pet), `generateBatch()` (ADMIN, UNASSIGNED), `activate()`, `markNfc()`.
- [ ] Endpoints: `GET /api/tags/mine`, `POST /api/tags/batch` (ADMIN), `POST /api/tags/activate`, `POST /api/tags/{id}/nfc`.
- **Acceptance:** tạo pet auto sinh 1 tag ACTIVE; tags page hiện đúng `public_code`, toggle NFC cập nhật `nfc_linked`.

### Phase 4 — Public Scan + Scan logging + Privacy (2 ngày) → mở khóa: `/t/[code]`, `/n/[code]`, nút Send Location
- [ ] Migration **V5** scan_logs.
- [ ] `GET /api/public/t/{code}` → `PublicScanResponse { status, pet|null }`:
  - status `NOT_FOUND` / `UNASSIGNED` / `ACTIVE`.
  - **Lọc privacy phía SERVER**: `show_phone=false` ⇒ KHÔNG trả phone; tương tự owner_name/location.
- [ ] `POST /api/scans` (publicCode, lat, lng, userAgent, device_type) → ghi log + tạo `Notification` cho owner.
- **Acceptance:** quét tag ACTIVE thấy hồ sơ đã lọc; tag UNASSIGNED ra trạng thái phù hợp; gửi vị trí ghi log + sinh thông báo.

### Phase 5 — Notifications + Scan History (1 ngày) → mở khóa: `/notifications`, `/scan/history`
- [ ] Migration **V6** notifications + enum `NotificationType` (SCAN/LOCATION/LOST/MEDICAL/SYSTEM).
- [ ] `GET /api/notifications`, `PATCH /api/notifications/{id}/read`.
- [ ] `GET /api/scans/history?petId=` nhóm theo ngày (`ScanLogResponse`).
- **Acceptance:** scan sinh notification; mark read hoạt động; history nhóm theo ngày + lọc theo pet.

### Phase 6 — Deferred (sau khi luồng chính chạy)
- [ ] Upload ảnh pet/owner (presigned URL hoặc `POST /api/pets/{id}/photo`) → set `photo_url`/`avatar_url`.
- [ ] Google + Facebook OAuth thật.
- [ ] Reverse-geocode lat/lng → `location_name`.
- [ ] Lost-mode `alert_radius_km`, đẩy notification theo bán kính.
- [ ] Seed data Bobby/Luna (tagCode A8K92X / B3M74Y) để khớp demo frontend.

---

## 3. Bảng API ↔ Màn frontend (tham chiếu nhanh)

| Endpoint | Màn FE | Service FE |
|----------|--------|-----------|
| POST /api/auth/register | /register | auth.service |
| POST /api/auth/login | /login | auth.service |
| GET /api/dashboard | /dashboard | (mới) dashboard.service |
| GET/POST/PUT/DELETE /api/pets | /pet, /pet/create, /pet/[id], /edit | pet.service |
| PUT /api/pets/{id}/lost-mode | /pet/[id]/lost-mode | pet.service |
| GET /api/tags/mine · activate · /nfc | /pet/[id]/tags | tag.service |
| GET /api/public/t/{code} | /t/[code], /n/[code] | tag.service |
| POST /api/scans | nút Send Location ở /t/[code] | scan.service |
| GET /api/scans/history | /scan/history | scan.service |
| GET /api/notifications · PATCH read | /notifications | notification.service |

---

## 4. application.yml (khung)

```yaml
server:
  port: 8080
  servlet:
    context-path: /api          # khớp axios baseURL .../api
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pawstag
    username: pawstag
    password: pawstag
  jpa:
    hibernate.ddl-auto: validate   # Flyway quản schema, JPA chỉ validate
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
app:
  jwt:
    secret: ${JWT_SECRET:change-me-in-prod}
    expiration-ms: 86400000        # 24h
  cors:
    allowed-origins: http://localhost:3000
```

---

## 5. Định dạng response chung (khớp frontend)

Mọi response bọc trong `ApiResponse` để khớp `types/response.ts`:
```json
{ "success": true, "data": { ... }, "message": null }
```
`GlobalExceptionHandler` trả `{ success:false, data:null, message:"..." }` với HTTP status đúng.

---

## 6. ✅ Các quyết định đã chốt (theo v4)

Toàn bộ điểm hở đã được chốt trong `PawsTag-Backend-Structure-v4.md`:

1. **Số "Call Owner"** → cột `pets.contact_phone` (nhập lúc tạo pet, bị `show_phone` kiểm soát). KHÔNG dùng `owners.phone`.
2. **Tuổi pet** → lưu `birth_date DATE`; `age` chuỗi tính trong `PetMapper`. Bỏ cột `age`.
3. **Field y tế** → gom thẳng vào `pets` (gồm cột `conditions` riêng cho `pet.medical.conditions`).
4. **Facebook** → thêm `FACEBOOK` vào `AuthProvider` + `facebook_id` + stub `POST /api/auth/facebook` (làm thật ở Phase 6).
5. **Dashboard** → stats có thêm `totalScans` (all-time) cho card "Total Scans".
6. **Lost-mode radius** → lưu `alert_radius_km`; nhận trong `LostModeRequest` (logic broadcast theo bán kính = Phase 6).

> Không còn quyết định nào treo. Có thể bắt đầu Phase 0 → Phase 5 theo đúng v4.
