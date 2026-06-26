# PawsTag — Frontend Project Structure

> Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4
> Tài liệu này mô tả cấu trúc thư mục thực tế của dự án `pawtag-web`.

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router + Turbopack) |
| Ngôn ngữ | TypeScript |
| Styling | Tailwind CSS v4 (`@theme` trong `globals.css`) |
| Auth state | React Context (`AuthContext`) + localStorage |
| HTTP client | Axios (`lib/axios.ts`) — sẵn sàng nối Spring Boot |
| Icons | lucide-react |
| Route protection | `proxy.ts` (Next.js 16 thay cho `middleware`) |

---

## Sơ đồ thư mục

```
pawtag-web/
├── PROJECT-STRUCTURE.md          # Tài liệu này
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
│
└── src/
    ├── proxy.ts                  # Route protection (Next.js 16 — KHÔNG dùng middleware.ts)
    │
    ├── app/                      # ── App Router (routable) ──
    │   ├── layout.tsx            # Root layout (fonts Nunito + Inter)
    │   ├── page.tsx              # Landing page  →  /
    │   ├── globals.css           # Tailwind v4 @theme + design tokens
    │   ├── loading.tsx           # UI loading toàn cục (Suspense)
    │   ├── error.tsx             # Error boundary toàn cục ("use client")
    │   ├── not-found.tsx         # Trang 404
    │   │
    │   ├── (auth)/               # Route group — không ảnh hưởng URL
    │   │   ├── layout.tsx        # Redirect nếu đã đăng nhập
    │   │   ├── login/page.tsx    # /login
    │   │   └── register/page.tsx # /register
    │   │
    │   ├── (dashboard)/          # Route group — app sau đăng nhập
    │   │   ├── layout.tsx        # Auth gate + Sidebar + PhoneFrame
    │   │   ├── dashboard/page.tsx        # /dashboard
    │   │   ├── notifications/page.tsx    # /notifications
    │   │   ├── passport/page.tsx         # /passport
    │   │   ├── profile/page.tsx          # /profile
    │   │   ├── scan/
    │   │   │   └── history/page.tsx      # /scan/history
    │   │   └── pet/
    │   │       ├── page.tsx              # /pet            (danh sách)
    │   │       ├── create/page.tsx       # /pet/create
    │   │       └── [petId]/
    │   │           ├── page.tsx          # /pet/[petId]            (chi tiết)
    │   │           ├── edit/page.tsx     # /pet/[petId]/edit
    │   │           ├── tags/page.tsx     # /pet/[petId]/tags       (QR/NFC)
    │   │           └── lost-mode/page.tsx# /pet/[petId]/lost-mode
    │   │
    │   ├── t/[code]/page.tsx     # /t/[code]  — trang công khai khi quét QR
    │   └── n/[code]/page.tsx     # /n/[code]  — NFC → redirect sang /t/[code]
    │
    ├── components/               # ── UI components (non-routable) ──
    │   ├── layout/               # PhoneFrame, Sidebar, BottomNav, StatusBar
    │   ├── ui/                   # Button, Input, Card, Modal, Spinner
    │   ├── pet/                  # PetCard, PetProfile, MedicalCard, QRCard
    │   └── scan/                 # ContactButtons, SendLocationButton
    │
    ├── context/
    │   └── AuthContext.tsx       # AuthProvider (login/register/logout + localStorage)
    │
    ├── hooks/
    │   ├── useAuth.ts            # re-export từ AuthContext
    │   ├── usePet.ts             # truy xuất pet theo id
    │   ├── useLocation.ts        # geolocation (idle/loading/success/denied)
    │   └── useScan.ts            # lịch sử quét
    │
    ├── services/                # ── API layer (Spring Boot, qua axios) ──
    │   ├── auth.service.ts
    │   ├── pet.service.ts
    │   ├── tag.service.ts
    │   ├── scan.service.ts
    │   └── notification.service.ts
    │
    ├── store/                   # Zustand stores (dự phòng cho tương lai)
    │   ├── authStore.ts
    │   └── notificationStore.ts
    │
    ├── lib/
    │   ├── axios.ts              # Axios instance + JWT interceptor
    │   ├── auth.ts               # token/session helpers (localStorage)
    │   ├── mock-data.ts          # MOCK_USER, MOCK_PETS, MOCK_SCANS, MOCK_NOTIFICATIONS
    │   └── utils.ts              # cn(), timeAgo()
    │
    ├── utils/
    │   ├── formatter.ts          # formatDate, formatPhone
    │   ├── validator.ts          # email, phone, password, required
    │   └── generateQR.ts         # generateQRCells(seed) — mẫu QR ổn định
    │
    ├── constants/
    │   ├── routes.ts             # ROUTES — toàn bộ đường dẫn
    │   └── colors.ts             # COLORS — design tokens
    │
    └── types/                   # ── Type definitions (tách theo domain) ──
        ├── index.ts             # re-export tất cả (backwards compat)
        ├── pet.ts               # PetSpecies, PetGender, PetStatus, PetMedical, Pet
        ├── owner.ts             # Owner (alias: User)
        ├── tag.ts               # Tag, TagType
        ├── scan.ts              # ScanLog
        └── response.ts          # ApiResponse, NotificationType, Notification
```

---

## Bảng route

| URL | File | Loại |
|-----|------|------|
| `/` | `app/page.tsx` | Static |
| `/login` | `app/(auth)/login/page.tsx` | Static |
| `/register` | `app/(auth)/register/page.tsx` | Static |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Static |
| `/pet` | `app/(dashboard)/pet/page.tsx` | Static |
| `/pet/create` | `app/(dashboard)/pet/create/page.tsx` | Static |
| `/pet/[petId]` | `app/(dashboard)/pet/[petId]/page.tsx` | Dynamic |
| `/pet/[petId]/edit` | `app/(dashboard)/pet/[petId]/edit/page.tsx` | Dynamic |
| `/pet/[petId]/tags` | `app/(dashboard)/pet/[petId]/tags/page.tsx` | Dynamic |
| `/pet/[petId]/lost-mode` | `app/(dashboard)/pet/[petId]/lost-mode/page.tsx` | Dynamic |
| `/scan/history` | `app/(dashboard)/scan/history/page.tsx` | Static |
| `/notifications` | `app/(dashboard)/notifications/page.tsx` | Static |
| `/passport` | `app/(dashboard)/passport/page.tsx` | Static |
| `/profile` | `app/(dashboard)/profile/page.tsx` | Static |
| `/t/[code]` | `app/t/[code]/page.tsx` | Dynamic — công khai (quét QR) |
| `/n/[code]` | `app/n/[code]/page.tsx` | Dynamic — NFC → redirect `/t/[code]` |

---

## Quy ước Next.js 16 áp dụng

- **Route protection dùng `proxy.ts`**, KHÔNG phải `middleware.ts` — Next.js 16 đã đổi tên convention `middleware` → `proxy`. Dùng `middleware.ts` ở phiên bản này sẽ gây lỗi.
- **Route groups** `(auth)` / `(dashboard)` gom layout mà không thêm segment vào URL.
- **Special files**: `layout`, `page`, `loading`, `error`, `not-found` đặt đúng theo convention App Router.
- **Dynamic segments** dùng `[petId]`, `[code]`; đọc params bằng `use(params)` (client) hoặc `await params` (server) theo chuẩn async params của Next.js 15+.
- **`src/` directory** được hỗ trợ chính thức; `proxy.ts` đặt trong `src/`.

---

## Nguyên tắc tổ chức

1. **Chỉ `app/` chứa routes.** Mọi thứ khác (`services`, `store`, `hooks`, `lib`, `utils`, `constants`, `types`, `components`) là non-routable, tách riêng theo chức năng.
2. **`services/` là lớp gọi API** tới Spring Boot qua `lib/axios.ts` — thay thế dần `lib/mock-data.ts` khi backend sẵn sàng.
3. **`types/` tách theo domain**, `index.ts` re-export để import gọn.
4. **Tags & Lost Mode gắn theo từng pet** (`/pet/[petId]/...`) thay vì trang toàn cục.
```
