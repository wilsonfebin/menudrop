# MenuDrop

AI specials publisher for restaurants. Snap or type today's specials -> MenuDrop reads the dishes, writes platform-ready captions (English + Malayalam), and generates a downloadable square image. Installable as a PWA, with Razorpay subscriptions and a free tier.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind**, **Supabase** (auth + Postgres), **OpenAI** (OCR + captions), **Cloudinary** (logo storage), **Sharp** (stateless image generation), and **Razorpay** (subscriptions).

## Quick start

```bash
# 1. Install dependencies (requires Node >= 18.18 and libvips for sharp)
npm install

# 2. Configure environment
cp .env.example .env.local
#    then fill in real credentials (see "Environment" below)

# 3. Set up the database
#    Open the Supabase SQL editor and run supabase/schema.sql

# 4. Run
npm run dev
# -> http://localhost:3000
```

The app **boots and renders with placeholder credentials** - auth runs in a demo
mode (OTP code `000000`) and live-API screens show a clear "not configured"
message until you add real keys. Fill in `.env.local` to enable real features.

## Architecture

```
src/
  app/
    (auth)/            login + OTP verify  (public)
    (app)/             dashboard, create flow, settings  (auth-gated)
    api/
      auth/            OTP send + verify
      profile/         profile CRUD + logo upload
      ai/extract       OCR / dish extraction      (OpenAI)
      ai/generate      caption generation         (OpenAI) + post history + gating
      image/generate   stateless PNG compositing  (Sharp) - no storage calls
      payments/        Razorpay create / verify / webhook
      posts/           post history feed
    error.tsx / not-found.tsx / loading.tsx
    middleware.ts      session-based route protection
  components/          NavBar, UI primitives
  hooks/               usePWAInstall, useRazorpay
  lib/
    ai/                prompts, OpenAI client, extract, generate
    image/             composite.ts, text-layer.ts (SVG -> PNG)
    supabase/          client / server / admin
    auth/              MSG91 OTP helpers
    cloudinary.ts, razorpay.ts, gating.ts, utils/
  store/               Zustand: profile, create-flow draft
  types/               domain + Supabase types
public/                manifest.json, icons, generated service worker
supabase/              schema.sql + setup notes
```

Design principles: types -> lib -> store -> API -> components -> pages (each
file's dependencies exist before it). The image route is **stateless** (returns
the PNG in the response body, no S3/Cloudinary/disk writes). AI calls are wrapped
in a retry helper. A `credsReady` guard lets the app build and render without
secrets.

## Environment

All variables live in `.env.local` (see `.env.example` for the full template).

| Group | Variables | Needed for |
|-------|-----------|-----------|
| Supabase | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | Auth + database |
| OpenAI (LLM) | OPENAI_API_KEY, OPENAI_MODEL, OPENAI_VISION_MODEL | OCR + captions |
| Cloudinary | CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET | Logo upload |
| Razorpay | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_*_PLAN_ID | Subscriptions |
| MSG91 | MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID | WhatsApp OTP (optional) |

## Scripts

```bash
npm run dev         # local dev server
npm run build       # production build
npm start           # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

## Docker

```bash
# Production image
docker compose up --build            # -> http://localhost:3000

# Hot-reload dev container
docker compose --profile dev up web-dev
```

## CI

`.github/workflows/ci.yml` runs typecheck -> lint -> build on every push/PR
(with placeholder env vars), then builds the Docker image.

## Note on requirements.txt

MenuDrop is a Node/TypeScript app - dependencies are managed by `package.json`.
`requirements.txt` is included only to document the system-level requirements
(Node, libvips) for infra parity; there is no Python runtime.
