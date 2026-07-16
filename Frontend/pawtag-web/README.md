# PawTag Web

Next.js frontend for PawTag.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Geolocation works on `localhost`, but mobile browsers opening a LAN URL such as
`http://192.168.x.x:3000` do not treat it as a secure context. Test location on
a phone through an HTTPS tunnel (the dev server accepts `*.trycloudflare.com`)
or through the production HTTPS URL.

By default the app calls `/api`, and `next.config.ts` proxies those requests to
`API_PROXY_TARGET` (`http://localhost:8082` locally).

## Environment variables

```env
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=http://localhost:8082
NEXT_PUBLIC_GOONG_MAPTILES_KEY=
```

For Vercel production, keep `NEXT_PUBLIC_API_URL=/api` and set:

```env
API_PROXY_TARGET=https://your-render-backend.onrender.com
```

Use the backend origin only, without the trailing `/api`; `next.config.ts` adds
`/api/:path*` automatically.

## Vercel settings

- Root Directory: `Frontend/pawtag-web`
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty/default

## Checks

```bash
npm run lint
npm exec tsc -- --noEmit
npm run build
```
