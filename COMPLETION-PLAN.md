# 🐾 PawsTag — Plan hoàn thiện (cập nhật)

> Rà soát lại toàn bộ Frontend (Next.js 16) · Backend (Spring Boot, 10 controller, 8 migration) · Database (PostgreSQL).
> Bản này phản ánh hiện trạng **sau Giai đoạn 1** + các fix gần đây.

---

## 1. ĐÃ HOÀN THÀNH ✅

### Backend (Phase 0–6 + Giai đoạn 1)
- Auth: JWT, register/login (**+ khóa 5 lần sai / 5 phút**), `/owners/me`, update profile, avatar upload
- Pets: CRUD (**PATCH semantics** — sửa không mất dữ liệu), lost-mode, photo upload, emergency contacts
- Tags: public_code ngẫu nhiên, auto-tag, batch/activate/nfc
- Public scan + lọc privacy server + scan log (**+ found report → notification ALERT**)
- Notifications: list/read/read-all/**clear**, on-scan
- Passport: identity/health/travel + **Vaccination/Vet visit CRUD** (add/delete)
- 8 migration, JPA validate pass

### Frontend (17+ trang, nối API thật)
- Landing · Login · Register (wizard 3 bước) · Dashboard · Pet list/detail · **Edit Pet (đầy đủ)** · **Delete Pet** · Tags (QR thật **+ activate tag**) · Lost Mode (2 trạng thái) · Scan history/entry · Notifications · Passport (3 tab **+ thêm/xóa vaccine/vet**) · Profile · Public scan (**+ I Found This Pet**)
- Fix gần đây: nút back dùng `router.back()` · avatar chữ-cái-đầu khi chưa có ảnh · ảnh local `/images/corgi.jpg` · fix stats bị che ở profile

---

## 2. CÒN THIẾU — rà từ code thật

### 🟠 A. Nút giao diện chưa có chức năng (UI-only)
| # | Nút | Trang | Làm được local? |
|---|---|---|---|
| A1 | **Save PDF** (passport, 2 chỗ) | `/passport` | ✅ (jsPDF/html2canvas) |
| A2 | **Share** (passport/tags/public scan) | nhiều | ✅ (Web Share API) |
| A3 | **Forgot password** | `/login` | ⚠️ cần email service |
| A4 | **Google / Facebook** (FE "coming soon", BE 501) | login/register | ⚠️ cần OAuth credential |
| A5 | **Neighborhood Alert** · **Found? Report Location** (của chủ) | `/pet/[id]/lost-mode` | ⚠️ cần hệ thống cộng đồng |

### 🟡 B. Settings & tài khoản chưa hoàn thiện
| # | Hạng mục | Hiện trạng |
|---|---|---|
| B1 | **Đổi mật khẩu** | Không có endpoint + UI (dòng "Privacy & Security" là nút tĩnh) |
| B2 | **Profile settings** (Notifications/Privacy/Help) | 3 dòng tĩnh, chưa bấm được |
| B3 | **Notification preferences** (bật/tắt loại thông báo) | Chưa có |

### 🟢 C. Dữ liệu giả / suy diễn
| # | Chỗ | Ghi chú |
|---|---|---|
| C1 | `scan_logs.location_name` = null → "Unknown location" | chưa reverse-geocode |
| C2 | Lost-mode stats (Notified/Sharing/Reports) | `demoStats()` — chưa có broadcast thật |
| C3 | Map (lost-mode) | lưới CSS, chưa phải bản đồ thật |
| C4 | Stub components rỗng `MedicalCard/PetProfile/QRCard` | **không dùng** → nên xóa |

### 🔵 D. Cần dịch vụ/hạ tầng ngoài
Google/FB OAuth (secret) · reverse-geocode (Nominatim free / Maps key) · bản đồ thật (Leaflet free) · camera QR scan (HTTPS) · email reset · test trên điện thoại thật (IP LAN)

### ⚙️ E. Production-readiness
- **Chưa có test** (Backend/src/test rỗng; FE chưa có test)
- **Chưa phân trang** (`/scans/history`, `/notifications` trả toàn bộ)
- Chưa rate-limit endpoint công khai (`/public/**`, `POST /scans`)
- Secret JWT/DB còn mặc định; chưa cấu hình prod/HTTPS/Docker backend/CI

---

## 3. PLAN (ưu tiên phần làm được local trước)

### 🥇 Giai đoạn 2 — ✅ HOÀN THÀNH
> ✅ Verify thật: **Export PDF** (jspdf + html2canvas-pro hỗ trợ oklch) · **Share** (Web Share API + copy fallback) · **Đổi mật khẩu** (BE `PUT /owners/me/password`, sai cũ→400) · **Notification prefs** (V9 + GET/PUT, sheet toggle) · **Help/FAQ** sheet · dọn 3 stub + sửa ảnh fallback `/images/corgi.jpg` + **pet list/detail dùng pet.photo thật**.

### 🥈 Giai đoạn 3 — ✅ HOÀN THÀNH (trừ OAuth cần credential)
> ✅ Verify thật:
> - **Reverse-geocode** (OSM Nominatim free) — scan tại Hoan Kiem → "Hoan Kiem Ward, Hà Nội"; điền `location_name` thật cho scan history / dashboard / lost-mode.
> - **Bản đồ Leaflet + OSM** ở lost-mode (marker tại vị trí quét cuối, dynamic import ssr:false).
> - **Camera QR scan** (`html5-qrcode`) ở `/scan` — bấm "Scan with Camera" → đọc QR → mở `/t/{code}`.
>
> ⏳ **Google/Facebook OAuth** — vẫn stub (cần Client ID/Secret từ Console). Khi có credential sẽ nối.

### 🥉 Giai đoạn 4 — Production-readiness
10. **Phân trang** + index cho `/scans/history`, `/notifications` (Pageable).
11. **Rate-limit** `/public/**` + `POST /scans` (Bucket4j) — chống spam scan.
12. **Real-time** notification (SSE/WebSocket) — chuông cập nhật tức thì.
13. **Test**: JUnit + Testcontainers (BE), Vitest/Playwright (FE).
14. **Đóng gói**: env secrets, Dockerfile backend, HTTPS, CI.
15. **Community broadcast thật** (C2) — bảng `lost_alerts` + đếm notified/reports thật.

---

## 4. Khuyến nghị
Làm **Giai đoạn 2** trước (hết nút chết + đổi mật khẩu) — toàn bộ local, giá trị thấy ngay.
Rồi **#6 reverse-geocode + #7 bản đồ** (free, làm app trông "thật" hẳn — rất đáng cho demo).
Giai đoạn 4 khi cần triển khai thật.

### Backend mới sẽ cần (GĐ2–3)
| Endpoint / thay đổi | Migration |
|---|---|
| `PUT /owners/me/password` | — |
| Notification prefs (cột owner) | V9 |
| Reverse-geocode trong ScanService | — (gọi API ngoài) |
| `lost_alerts` + counters (GĐ4) | V10 |
