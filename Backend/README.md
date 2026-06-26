# PawsTag Backend

Spring Boot 3.3 · Java 17 · PostgreSQL · Flyway · JWT · Swagger.
Phục vụ frontend `Frontend/pawtag-web`. Hợp đồng dữ liệu: xem `PawsTag-Backend-Structure-v4.md` + `BACKEND-DEVELOPMENT-PLAN.md`.

## Chạy local

```bash
# 1. Bật PostgreSQL (Docker)
docker compose up -d

# 2. Chạy app
mvn spring-boot:run
```

- API base: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- Health: `GET http://localhost:8080/api/health`

## Cấu hình

| Env | Mặc định | Ý nghĩa |
|-----|----------|---------|
| `JWT_SECRET` | dev secret | Khóa ký JWT (đổi ở prod) |
| `CORS_ORIGINS` | http://localhost:3000 | Origin frontend được phép gọi |

DB mặc định: `pawstag / pawstag / pawstag` tại `localhost:5433` (xem `docker-compose.yml` — dùng 5433 ở host để tránh PostgreSQL có sẵn trên 5432).

## Trạng thái

- ✅ **Phase 0** — Bootstrap: Spring Boot + Postgres + Flyway + Swagger + CORS + ApiResponse + GlobalExceptionHandler.
- ✅ **Phase 1** — Auth: owners (V1), JWT (HS384), register/login/logout, stub google/facebook (501), `GET /owners/me` (cần JWT), SecurityConfig siết theo plan.
- ✅ **Phase 2** — Pets + Emergency Contacts + Dashboard: V2/V3, CRUD `/pets`, `/pets/{id}/lost-mode`, `/dashboard`; PetResponse khớp `types/pet.ts` (age tính từ birthDate, status từ is_lost, medical lồng nhau); owner-scoped (chặn chéo owner).
- ✅ **Phase 3** — Tags: V4, sinh `public_code` ngẫu nhiên (6 ký tự), auto-tag ACTIVE khi tạo pet, `/tags/mine`, `/tags/batch` (ADMIN), `/tags/activate`, `/tags/{id}/nfc`; nối `tagCode` vào PetResponse + `activeTags` vào dashboard; xóa pet → thu hồi tag về UNASSIGNED.
- ✅ **Phase 4** — Public Scan + Scan log: V5, `GET /public/t/{code}` (NOT_FOUND/UNASSIGNED/ACTIVE, **lọc privacy ở server** — show_phone/show_owner_name), `POST /scans` (công khai, ghi log + detect device); nối `scansToday`/`totalScans` thật vào PetResponse + `scansToday`/`totalScans`/`recentScans` vào dashboard.
- ✅ **Phase 5** — Notifications + Scan history: V6, `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `GET /scans/history?petId=`; **notification tự tạo khi scan** (SCAN/LOCATION); owner-scoped.
- ✅ **Phase 6 (một phần)** — Media + Profile: upload ảnh pet (`POST /pets/{id}/photo`) + avatar (`POST /owners/me/avatar`) lưu file local, serve tại `/uploads/**`; cập nhật profile (`PUT /owners/me`); frontend: **QR thật quét được** (qrcode.react), chọn ảnh khi tạo pet, đổi avatar + lưu profile.
- ⏳ Phase 6 (còn lại — cần dịch vụ ngoài): Google/Facebook OAuth thật (cần client secret), reverse-geocode (cần API key), broadcast lost-radius.

Lộ trình đầy đủ: `BACKEND-DEVELOPMENT-PLAN.md` §2.
