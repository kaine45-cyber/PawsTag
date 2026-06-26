# 🐾 PawsTag — Plan hoàn thiện chức năng

> Lập sau khi đọc lại toàn bộ **Frontend** (Next.js 16), **Backend** (Spring Boot, 9 controller, 8 migration) và **Database** (PostgreSQL).
> Mục tiêu: liệt kê đúng những gì CÒN THIẾU và xếp ưu tiên để hoàn thiện.

---

## 1. Hiện trạng (đã xong)

### Backend (Phase 0–6) — chạy thật, verify đầy đủ
| Nhóm | Trạng thái |
|---|---|
| Auth (JWT, register/login, /owners/me) | ✅ |
| Owners (update profile, avatar upload) | ✅ |
| Pets CRUD + lost-mode + photo upload | ✅ |
| Emergency contacts | ✅ |
| Tags (public_code, batch/activate/nfc, auto-tag) | ✅ |
| Public scan + privacy filter + scan log | ✅ |
| Notifications (list/read/read-all/**clear**, on-scan) | ✅ |
| Passport (identity/health/travel, vaccinations, vet visits) | ✅ |
| 8 migration V1–V8, JPA validate pass | ✅ |

### Frontend — 17 trang, nối API thật
Landing · Login · Register (wizard 3 bước) · Dashboard · Pet list · Pet detail · **Pet create (wizard)** · Tags (QR thật) · Lost Mode (2 trạng thái) · Scan history · Scan entry · Notifications · Passport (3 tab) · Profile · Public scan `/t/[code]` · NFC redirect `/n/[code]`.

---

## 2. CÒN THIẾU — phân tích theo file thật

### 🔴 A. Chức năng lõi chưa hoàn thiện (làm được 100% local)
| # | Hạng mục | Hiện trạng | Backend sẵn? |
|---|---|---|---|
| A1 | **Edit Pet** | `edit/page.tsx` chỉ là stub "Edit form coming soon..." | ✅ `PUT /pets/{id}` |
| A2 | **Delete Pet** | Không có nút xóa ở UI | ✅ `DELETE /pets/{id}` |
| A3 | **Quản lý Vaccination / Vet visit** | Chỉ đọc (passport) + seed; **không có UI/endpoint thêm-sửa-xóa** | ❌ cần CRUD endpoint |
| A4 | **Kích hoạt tag vật lý (Activate)** | Backend có `/tags/activate` nhưng **không có UI** nhập mã thẻ | ✅ |
| A5 | **Emergency contacts (sửa sau khi tạo)** | Chỉ nhập lúc create; pet detail/edit không sửa được | ✅ (qua PetRequest) |
| A6 | **Profile settings** | 3 dòng Notifications/Privacy/Help là nút tĩnh | ❌ cần thiết kế |

### 🟠 B. Nút giao diện chưa có chức năng thật
| # | Nút | Ở đâu |
|---|---|---|
| B1 | Save PDF / Share (passport) | `/passport` |
| B2 | Download / Share (tags, public scan) | `/pet/[id]/tags`, `/t/[code]` |
| B3 | Neighborhood Alert · Found? Report Location | `/pet/[id]/lost-mode` |
| B4 | Forgot password | `/login` |
| B5 | Google / Facebook (FE "coming soon", BE 501) | login/register |

### 🟡 C. Dữ liệu giả / suy diễn (chưa "thật")
| # | Chỗ | Ghi chú |
|---|---|---|
| C1 | Lost-mode stats (Notified/Sharing/Reports) | `demoStats()` — chưa có hệ thống broadcast cộng đồng |
| C2 | `scan_logs.location_name` = null → "Unknown location" | chưa reverse-geocode |
| C3 | Map trong lost-mode | lưới CSS trang trí, chưa phải bản đồ thật |
| C4 | Stub components | `MedicalCard/PetProfile/QRCard` rỗng, **không dùng** → nên xóa |

### 🔵 D. Cần dịch vụ/hạ tầng ngoài
| # | Hạng mục | Cần gì |
|---|---|---|
| D1 | Google/Facebook OAuth thật | Client ID + Secret (Google/FB Console) |
| D2 | Reverse-geocode | OSM Nominatim (free) hoặc Google Maps API key |
| D3 | Bản đồ thật | Leaflet (free, OSM tiles) / Google Maps |
| D4 | Real-time scan alert | WebSocket/SSE |
| D5 | Quét QR bằng camera trong app | thư viện scanner + HTTPS/LAN |
| D6 | Forgot password | dịch vụ gửi email (SMTP/SendGrid) |
| D7 | Test trên điện thoại thật | cấu hình IP LAN thay localhost |

### ⚙️ E. Production-readiness
- Chưa có test tự động (JUnit/integration BE, Vitest/Playwright FE)
- Chưa phân trang (`/scans/history`, `/notifications` trả toàn bộ)
- Chưa rate-limit endpoint công khai (`/public/**`, `POST /scans`)
- Secret JWT/DB còn hardcode mặc định; chưa cấu hình prod/HTTPS
- Chưa Dockerize backend / CI-CD

---

## 3. PLAN HOÀN THIỆN (xếp ưu tiên)

### 🥇 Giai đoạn 1 — Đóng kín CRUD lõi — ✅ HOÀN THÀNH
**Mục tiêu: mọi dữ liệu người dùng thấy đều sửa được, không còn nút chết quan trọng.**

> ✅ Đã xong & verify thật: Edit Pet (form đầy đủ, **PATCH semantics** chống mất dữ liệu) · Delete Pet (confirm) · Activate physical tag · Vaccination/Vet CRUD (Health tab) · Found→Report (public scan → notification ALERT). Backend mới: 4 endpoint health-record + `found` flag; PetMapper chuyển sang PATCH; PetResponse expose collar/identificationNotes.

1. **Edit Pet** (A1) — form đầy đủ (giống create) nạp dữ liệu pet, `PUT /pets/{id}`, đổi ảnh, sửa emergency contacts.
2. **Delete Pet** (A2) — nút xóa ở pet detail + xác nhận → `DELETE /pets/{id}` → refresh.
3. **Activate physical tag** (A4) — trên trang Tags hoặc Scan: ô nhập mã thẻ → `POST /tags/activate`.
4. **Vaccination & Vet visit CRUD** (A3) — **backend**: endpoint `POST/PUT/DELETE /pets/{id}/vaccinations` + `/vet-visits`; **frontend**: nút "＋ Add" trong tab Health của passport (modal nhập).
5. **Found Pet → Report Location** (B3) — trang công khai `/t/[code]` thêm nút "I found this pet" → `POST /scans` (đã có) + notification "Found report" cho owner.

*Ước lượng: ~1–1.5 ngày. Backend mới: 6 endpoint (vaccination/vet CRUD).*

### 🥈 Giai đoạn 2 — Polish & UX (không cần dịch vụ ngoài)
6. **Export PDF passport** (B1) — `jspdf` + `html2canvas` render tab thành PDF.
7. **Share thật** (B2) — Web Share API (`navigator.share`) + fallback copy link.
8. **Profile settings thật** (A6) — trang con: bật/tắt loại thông báo (lưu cột owner), đổi mật khẩu (`PUT /owners/me/password`), trang Help/FAQ tĩnh.
9. **Image crop/resize** trước upload — nén client để < 1MB.
10. **Loading skeleton + empty states** đồng bộ toàn app.
11. **Dọn dẹp** (C4) — xóa stub `MedicalCard/PetProfile/QRCard`.

*Ước lượng: ~1.5–2 ngày. Backend mới: đổi mật khẩu + notification prefs.*

### 🥉 Giai đoạn 3 — Tính năng "thật" cần API ngoài (chọn theo nhu cầu)
12. **Reverse-geocode** (C2/D2) — gọi OSM Nominatim khi `POST /scans` → điền `location_name` thật ("Hoan Kiem District, Hanoi"). *Free, không cần key.* → làm cho scan history / lost-mode / dashboard thành địa danh thật.
13. **Bản đồ thật** (C3/D3) — Leaflet + OSM tiles ở lost-mode & scan history (free).
14. **Google OAuth** (B5/D1) — khi có Client ID/Secret: verify idToken, tạo/gắn owner.
15. **Quét QR bằng camera** (D5) — `html5-qrcode` ở trang `/scan` (cần HTTPS hoặc localhost).
16. **Cấu hình LAN** (D7) — chạy FE/BE theo IP máy để quét QR từ điện thoại thật.

*Ước lượng: 12,13,16 ~1 ngày (free); 14 cần credential; 15 cần HTTPS.*

### 🏅 Giai đoạn 4 — Production-readiness (D4, E)
17. Phân trang + index DB cho scans/notifications.
18. Rate-limit `/public/**` + `POST /scans` (Bucket4j).
19. Real-time notification (SSE đơn giản hoặc WebSocket).
20. Test: JUnit + Testcontainers (BE), Vitest/Playwright (FE).
21. Tách config prod (env secrets), Dockerfile backend, HTTPS.
22. Community broadcast thật (C1) — bảng `lost_alerts` + đếm notified/reports thật.

---

## 4. Khuyến nghị bắt đầu

**Làm Giai đoạn 1 trước** — đóng kín CRUD để app "đầy đủ chức năng" thật sự (edit/delete pet, quản lý vaccine, activate tag, report found). Đây là phần giá trị nhất, hoàn toàn local, không phụ thuộc dịch vụ ngoài.

Sau đó Giai đoạn 2 (PDF/share/settings) để hết "nút chết". Giai đoạn 3–4 tùy mục tiêu (demo portfolio thì 12+13 — địa danh + bản đồ thật — rất đáng làm vì free).

---

## 5. Tổng kết backend mới cần thêm (nếu làm GĐ 1–2)
| Endpoint | Mục đích | Migration |
|---|---|---|
| `POST/PUT/DELETE /pets/{id}/vaccinations` | quản lý sổ tiêm | — (bảng V8 có sẵn) |
| `POST/PUT/DELETE /pets/{id}/vet-visits` | lịch sử khám | — (bảng V8 có sẵn) |
| `PUT /owners/me/password` | đổi mật khẩu | — |
| `notification prefs` (cột owner) | bật/tắt loại thông báo | V9 (thêm cột) |
| `lost_alerts` + counters (GĐ4) | broadcast thật | V10 |

> Phần lớn GĐ 1 **không cần migration** — bảng vaccinations/vet_visits đã tạo ở V8, chỉ thiếu endpoint ghi.
