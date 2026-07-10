# 🐾 PawsTag — Plan sửa lỗi (từ review dùng thử thật, 2026-07-06)

> Phát hiện bằng cách chạy app thật (đăng ký, tạo pet, quét QR, bật lost-mode, xem passport) trên localhost.
> Mỗi mục có file:dòng cụ thể đã xác minh trong code.

---

## Phase 1 — Ưu tiên cao (gây hiểu lầm / mất niềm tin người dùng)

### 1.1 Số liệu cộng đồng ở Lost Mode là giả, hiện ngay cả khi vừa bật
**File:** `Frontend/pawtag-web/src/app/(dashboard)/pet/[petId]/lost-mode/page.tsx:29-33, 69`
```ts
function demoStats(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return { notified: 200 + (h % 800), sharing: 5 + (h % 25), reports: h % 6 };
}
```
Hàm băm theo `pet.id` → luôn ra một số cố định 200–1000/5–30/0–5, hiển thị "999 Đã báo / 29 Chia sẻ / 3 Báo cáo" ngay cả khi pet mới bật lost-mode được vài giây, chưa có broadcast thật nào.
**Fix:** Bỏ `demoStats`, thay bằng số thật (0 nếu chưa có hạ tầng broadcast) hoặc ẩn hẳn khối 3 số này cho tới khi có bảng `lost_alerts` + counters thật (đã ghi trong COMPLETION-PLAN.md mục 15, Giai đoạn 4).
**Effort:** nhỏ (FE only, xoá 1 hàm + điều kiện ẩn khối UI).

### 1.2 "0/0 vắc-xin" vẫn hiện nhãn "Đầy đủ ✅"
**File:** `Frontend/pawtag-web/src/app/(dashboard)/passport/page.tsx:261, 263`
```tsx
<StatBox value={`${data.health.vaccinesValid}/${data.health.vaccinesTotal}`} label={t("pp.vaccines")} sub={t("pp.upToDate")} .../>
<StatBox value={`${data.health.healthScore}%`} label={t("pp.healthScore")} sub={...} .../>
```
`sub` luôn là `t("pp.upToDate")` ("Đầy đủ ✅") bất kể `vaccinesTotal` có bằng 0 hay không — pet chưa từng có hồ sơ tiêm phòng vẫn bị gắn nhãn "đầy đủ". Tương tự `healthScore` hiện % cố định dù chưa có dữ liệu y tế thật.
**Fix:** Thêm điều kiện: nếu `vaccinesTotal === 0` → hiện `t("pp.noData")` (cần thêm key mới) thay vì "Đầy đủ ✅"; `healthScore` chỉ hiện khi có ít nhất 1 bản ghi y tế, ngược lại hiện "Chưa đủ dữ liệu".
**Effort:** nhỏ.

### 1.3 Lost Mode: thông báo vị trí mâu thuẫn nhau trong cùng 1 màn
**File:** `Frontend/pawtag-web/src/app/(dashboard)/pet/[petId]/lost-mode/page.tsx:191-206`
Khối bản đồ dùng điều kiện `lastScan?.lat != null` để hiện hint "Chưa có vị trí — chờ lượt quét tag đầu tiên" (dòng 199), nhưng khối text ngay dưới (dòng 205-206) lại hiện `lastScan?.location` (vd. "Unknown location") + `lastScan?.time` ("3 phút trước") miễn là **có** bản ghi scan — kể cả khi bản ghi đó không có toạ độ. Kết quả: 2 dòng liền kề nói ngược nhau ("chưa có vị trí" ngay trên "thấy lần cuối 3 phút trước").
**Fix:** Dùng chung 1 điều kiện (`lastScan?.lat != null`) cho cả khối bản đồ lẫn khối text, hoặc phân biệt rõ 2 trạng thái: "chưa từng bị quét" vs "đã quét nhưng người quét không chia sẻ GPS".
**Effort:** nhỏ.

---

## Phase 2 — ✅ HOÀN THÀNH (2026-07-06)

App có `LanguageContext` (`src/i18n/LanguageContext.tsx`) mặc định `"vi"` và hoạt động đúng — nhưng nhiều chỗ hoặc (a) hardcode tiếng Anh thẳng trong JSX, không qua `t()`, hoặc (b) gọi `t()` với key mà bản dịch `vi` bị thiếu nên fallback sang `en`.

### 2.1 ✅ Link NFC hiển thị hardcode domain production thay vì origin thật
`tags/page.tsx:204` đổi sang dùng `origin` như `tagUrl` (dòng 64). Nhân tiện dọn luôn 2 chỗ hardcode tiếng Anh khác trong cùng file: thông báo kích hoạt tag (`activateTag()`) và placeholder input mã tag "e.g. A8K92X" → chuyển hết qua `t()` (key mới `tags.activateSuccess/activateError/codePlaceholder`).

### 2.2 ✅ Poster "LOST PET" hoàn toàn tiếng Anh, không qua i18n
Thêm namespace `poster.*` vào `messages.ts` (12 key, cả `en`/`vi`), thay toàn bộ text tĩnh trong khối poster (`lost-mode/page.tsx`) bằng `t("poster.xxx")`. Nhân tiện thêm `encodeURIComponent` cho link chia sẻ Zalo (trước đó thiếu, có thể vỡ URL khi tên pet có ký tự đặc biệt) và thêm key `lost.shareText` cho text chia sẻ.

### 2.3 ✅ Passport tab Sức khoẻ/Du lịch fallback sang tiếng Anh — **hoá ra là lỗi Backend, không phải FE**
Audit lại phát hiện: field `data.travel` và `data.medical.{allergies,medications,neutered}` không đi qua `t()` ở frontend — chúng là **data thật trả về từ API** `GET /pets/{petId}/passport`. Toàn bộ chuỗi "Rabies vaccination", "Not recorded", "Missing", "None known"... được hardcode trực tiếp trong `Backend/src/main/java/vn/pawstag/service/impl/PassportServiceImpl.java` (dòng 120-178, hàm `buildTravel()` + phần dựng `MedicalNotes`). Đã dịch toàn bộ sang tiếng Việt (backend không có cơ chế i18n theo request nên dịch cứng luôn, khớp phần còn lại của app).
**⚠️ Cần restart backend** (`mvn spring-boot:run` lại) để thấy thay đổi — pom.xml không có `spring-boot-devtools` nên không tự reload.
**Ghi chú thêm (chưa sửa, để dành):** `DateTimeFormatter` dùng `Locale.ENGLISH` cho mọi ngày tháng (`"MMM yyyy"` → "Jul 2024") — ngày sinh, ngày tiêm, ngày khám đều hiện tháng viết tắt tiếng Anh. Đổi locale ảnh hưởng nhiều field cùng lúc nên chưa đụng vào, để Phase sau nếu muốn làm triệt để.

### 2.4 ✅ Placeholder tiếng Anh trong form tạo pet
`pet/create/page.tsx` — placeholder Giống/Tuổi đổi sang `t("cw.breedPlaceholder"/"cw.agePlaceholder")` (vi: "vd. Corgi Pembroke Welsh" / "vd. 2 năm 6 tháng"). **Quan trọng:** hàm `ageToBirthDate()` chỉ nhận diện "year"/"month" bằng regex — đã sửa để nhận thêm "năm"/"tháng", nếu không tuổi nhập tiếng Việt sẽ không tính ra được ngày sinh.

### 2.5 ✅ Nhãn trạng thái pet "LOST" tiếng Anh ở nhiều nơi
Không chỉ Profile — tìm thấy 3 chỗ hardcode `"LOST"/"Safe"` không qua `t()`: `profile/page.tsx:197`, `dashboard/page.tsx:131`, `components/pet/PetCard.tsx:10`. Cả 3 đã chuyển sang `t("common.lost")`/`t("common.safe")` (key đã có sẵn, chỉ là chưa được dùng).

---

## Phase 3 — ✅ HOÀN THÀNH (2026-07-07) — Hiệu năng & độ tin cậy Backend

### 3.1 ✅ N+1 query khi liệt kê pet
**File:** `Backend/src/main/java/vn/pawstag/mapper/PetMapper.java`, `PetRepository.java`, `TagRepository.java`, `ScanLogRepository.java`
Thêm `PetMapper.toResponseBatch(List<Pet>)`: 3 query gộp dùng `IN (...)` (tag ACTIVE, tổng scan, scan hôm nay — qua projection `TagRepository.PetTagCode` / `ScanLogRepository.PetScanCount`) thay vì 3 query/pet; `PetRepository.findByOwnerIdOrderByCreatedAtDesc` thêm `@EntityGraph(attributePaths = "emergencyContacts")` để JOIN sẵn thay vì lazy-load từng pet. `toResponse(Pet)` cũ giữ nguyên chữ ký (dùng cho create/update/1 pet), nội bộ gọi `toResponseBatch(List.of(p))`. `PetServiceImpl.list()` và `DashboardServiceImpl.getDashboard()` đổi sang gọi `petMapper.toResponseBatch(pets)`.
**⚠️ Cần restart backend** để có hiệu lực.

### 3.2 ✅ Reverse-geocode chặn transaction khi ghi scan
**File:** `ScanServiceImpl.java`, `ScanGeocodeUpdater.java` (mới), `event/ScanRecordedEvent.java` (mới), `PawsTagApplication.java`
`record()` giờ lưu `ScanLog` ngay (chưa có `locationName`) rồi publish `ScanRecordedEvent`; `ScanGeocodeUpdater.onScanRecorded` lắng nghe bằng `@TransactionalEventListener(phase = AFTER_COMMIT)` + `@Async` (bean riêng để proxy AOP hoạt động, tránh self-invocation) — chỉ gọi Nominatim + update `location_name` **sau khi** transaction lưu scan đã commit, không giữ connection DB chờ mạng ngoài. Thêm `@EnableAsync` vào `PawsTagApplication`.
**⚠️ Cần restart backend** để có hiệu lực. (Dùng executor mặc định của Spring — đủ cho traffic hiện tại; nếu volume tăng nhiều có thể cấu hình thread pool riêng sau.)

---

## Phase 4 — ✅ HOÀN THÀNH (2026-07-07) — Cosmetic

### 4.1 ✅ Thanh cuộn trình duyệt nổi lơ lửng giữa khoảng trắng
**File:** `Frontend/pawtag-web/src/components/layout/PhoneFrame.tsx`
Trước đây khung dùng `min-h-screen` (chỉ set chiều cao tối thiểu) nên khi nội dung dài hơn 1 màn hình, cả `<div>` lẫn `<body>` giãn ra cao hơn viewport → `<body>` bị tràn và scrollbar xuất hiện ở mép thật của cửa sổ trình duyệt, xa hẳn khung 480px hiển thị ở giữa (chỉ thấy trên desktop, màn rộng).
**Fix:** Đổi `min-h-screen` → `h-screen overflow-y-auto overscroll-contain` — khung tự cuộn nội bộ, không còn giãn `<body>` vượt quá viewport, nên scrollbar giờ bám sát mép khung 480px thay vì mép cửa sổ. Không cần đổi gì ở `<html>/<body>`/globals.css vì `<body>` giờ không còn tràn nữa. Không ảnh hưởng điện thoại thật (ở đó khung đã full width nên hành vi cuộn không đổi).

---

## Thứ tự đề xuất
1. ✅ Phase 1 (1.1 → 1.3) — đã xong.
2. ✅ Phase 2 (2.1 → 2.5) — đã xong. **Cần restart backend** để mục 2.3 có hiệu lực.
3. ✅ Phase 3 (3.1, 3.2) — đã xong. **Cần restart backend** để có hiệu lực.
4. ✅ Phase 4 (4.1) — đã xong. Frontend-only, tự áp dụng khi Next.js reload (không cần restart backend).

Các mục lớn hơn đã ghi ở COMPLETION-PLAN.md (pagination, test, real-time notification, OAuth thật, JWT refresh) không lặp lại ở đây — vẫn còn nguyên trong backlog Giai đoạn 4.
