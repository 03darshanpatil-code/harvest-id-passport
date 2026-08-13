# HarvestID — Complete End-to-End Technical & Development Documentation

> Based on the **actual repository** (`03darshanpatil-code/harvest-id-passport`, `main` branch).
> Everything below was verified from source code, configuration files, API routes, database schema, Git history and deployment configuration present in the repository. Anything that could **not** be verified from the repository is explicitly marked **"Not verifiable from repository"**.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Development From Scratch — Workflow](#5-development-from-scratch--workflow)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Every Major Feature — Technical Breakdown](#7-every-major-feature--technical-breakdown)
8. [Database Architecture](#8-database-architecture)
9. [Supabase Integration](#9-supabase-integration)
10. [Backend Architecture](#10-backend-architecture)
11. [Complete API Documentation](#11-complete-api-documentation)
12. [AI Farmer Assistant](#12-ai-farmer-assistant)
13. [Multilingual System](#13-multilingual-system)
14. [Voice System](#14-voice-system)
15. [GPS & Location System](#15-gps--location-system)
16. [QR + Digital Crop Passport](#16-qr--digital-crop-passport)
17. [Crop Image System](#17-crop-image-system)
18. [UI / UX / Animation System](#18-ui--ux--animation-system)
19. [Logo / Branding](#19-logo--branding)
20. [Security](#20-security)
21. [Error Handling + Production Fixes](#21-error-handling--production-fixes)
22. [Git + GitHub Workflow](#22-git--github-workflow)
23. [Vercel Deployment](#23-vercel-deployment)
24. [Render Deployment](#24-render-deployment)
25. [Complete Production Architecture](#25-complete-production-architecture)
26. [Complete User Workflow](#26-complete-user-workflow)
27. [Data Flow Examples](#27-data-flow-examples)
28. [Local Development Setup](#28-local-development-setup)
29. [Environment Variables](#29-environment-variables)
30. [Testing + Verification](#30-testing--verification)
31. [Performance + Scalability](#31-performance--scalability)
32. [Limitations](#32-limitations)
33. [Future Roadmap](#33-future-roadmap)
34. [File-to-Feature Mapping](#34-file-to-feature-mapping)
35. [Complete Request/Response Flows](#35-complete-requestresponse-flows)
36. ["How HarvestID Was Built" — Simple Explanation](#36-how-harvestid-was-built--simple-explanation)
37. [Project Presentation Version](#37-project-presentation-version)
38. [Final Architecture Summary](#38-final-architecture-summary)
39. [One-Page Project Workflow](#39-one-page-project-workflow)

---

## 1. Executive Summary

**HarvestID** is a production web application that gives every crop a **verifiable digital identity**. A smallholder farmer registers a crop (name, variety, location, dates, optional GPS and photo), records field activities over time (notes, photos, voice notes), and the app automatically builds a **digital crop passport** — a read-only, QR-scannable page showing origin, cultivation timeline, media evidence, and an AI-generated traceability summary that buyers can verify with one scan.

The application is fully multilingual (**13 Indian languages + English**), includes a **Gemini-powered farmer AI assistant** with **voice input, voice output, and voice navigation**, captures **GPS location** for origin verification, resolves **crop photos automatically** from a curated catalog, and ships a polished, animated, mobile-first UI with official HarvestID branding.

Architecture in one line: a **TanStack Start (React 19) + Vite + Tailwind 4** SSR frontend on **Vercel**, an **Express.js (Node)** REST API on **Render**, a **Supabase (PostgreSQL)** database, and **Google Gemini** for AI.

---

## 2. Project Overview

### 2.1 In simple language (for non-technical readers)

Imagine a farmer who grows tomatoes, wheat, or rice. Buyers today cannot easily prove *where* a crop came from, *who* grew it, or *how* it was cared for. HarvestID solves this:

- The farmer **opens the HarvestID website** and picks their language (English, हिन्दी, ಕನ್ನಡ, తెలుగు, தமிழ், മലയാളം, मराठी, বাংলা, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو).
- They **register each crop** with its name, variety, farm location, planting and expected-harvest dates, optionally its GPS coordinates and a photo.
- Every time they do something in the field — sowing, irrigating, fertilizing, pest checks, harvesting — they **record an activity** with a note, a photo and/or a voice note. The app can **AI-format the note** automatically.
- The app keeps a **timeline** and computes a **traceability score** (how well-documented the crop is).
- With one click the farmer **generates a digital crop passport**: a clean, read-only page with a **QR code**. Any buyer who scans the QR opens that crop's passport and sees the verified origin, timeline, and an **AI-written traceability summary**.
- The farmer can also **ask the AI assistant** questions like *"How should I take care of my tomato crop?"* — typed or spoken — and get an answer in their language, optionally read aloud.

### 2.2 Technical overview (for developers)

- **Frontend**: TanStack Start (full-stack React 19 framework) with file-based TanStack Router, React Query 5, Tailwind CSS 4, shadcn/ui (Radix primitives), lucide-react icons, Recharts analytics, react-qr-code / html5-qrcode for QR, sonner toasts, and a custom CSS motion system. Rendered **server-side (SSR)** with a custom error wrapper in `src/server.ts`.
- **Backend**: A separate Express.js (CommonJS, Node) REST API in `backend/` mounted on Render. Controllers talk to **Supabase** via `@supabase/supabase-js`, with **JSON-file fallback stores** when a Supabase table is missing or a query fails.
- **Database**: Supabase (PostgreSQL). Two tables: `harvest` (crops) and `activities` (field records, FK to `harvest` with cascade delete). RLS enabled with permissive `anon` policies.
- **AI**: `POST /api/chat` on the backend forwards the farmer's question + language + context to **Google Gemini** (`generativelanguage.googleapis.com/v1beta`) with an ordered **model fallback list** (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`, overridable via `GEMINI_MODEL`). The API key lives **only on the server**.
- **Deployment**: Frontend → Vercel (auto-deploy on push to `main`; no `vercel.json` in the repo — platform defaults apply). Backend → Render (`https://harvest-id-backend.onrender.com`). Repository → GitHub (`03darshanpatil-code/harvest-id-passport`).
- **Identity/branding**: A single official logo asset `public/logo/harvestID logo.jpeg` rendered through one reusable `HarvestIDLogo` component everywhere, plus favicon links.

---

## 3. Technology Stack

### 3.1 Stack table (versions verified from `package.json` / `backend/package.json`)

| Layer | Technology | Version (verified) | Where used |
|---|---|---|---|
| Frontend framework | TanStack Start (React SSR full-stack) | `@tanstack/react-start ^1.168.32` | `src/router.tsx`, `src/start.ts`, `src/server.ts` |
| UI library | React | `^19.2.0` (react, react-dom) | All components |
| Routing | TanStack Router (file-based) | `@tanstack/react-router ^1.170.18` | `src/routes/**`, `src/routeTree.gen.ts` |
| Data fetching (client) | TanStack React Query | `@tanstack/react-query ^5.101.1` | `src/router.tsx` (QueryClient) |
| Styling | Tailwind CSS 4 | `tailwindcss ^4.2.1`, `@tailwindcss/vite ^4.2.1` | `src/styles.css`, all components |
| UI component kit | shadcn/ui (new-york style, Radix) | Radix packages `^1.x`, `tw-animate-css ^1.3.4` | `src/components/ui/**` |
| Icons | lucide-react | `^0.575.0` | All pages/components |
| Animations | Custom CSS/SVG (Tailwind utilities) | — | `src/styles.css` |
| State management | React Context + hooks (custom store) | React built-in | `src/lib/harvest-store.tsx`, `src/i18n/index.tsx` |
| i18n | Custom React Context provider (13 + 1 catalogs) | — | `src/i18n/*` |
| Forms | react-hook-form + zod + @hookform/resolvers (available) | `^7.71.2`, `^3.24.2`, `^5.2.2` | Available; forms mostly controlled `useState` |
| Charts | Recharts | `^2.15.4` | `src/routes/analytics.tsx` |
| Toasts | sonner | `^2.0.7` | Throughout |
| QR generation | react-qr-code | `^2.2.0` | `src/components/QrCode.tsx` |
| QR scanning | html5-qrcode | `^2.3.8` | `src/components/QrScannerDialog.tsx` (dynamic import) |
| Backend framework | Express.js | `express ^4.21.2` (CommonJS) | `backend/server.js`, routes |
| Backend runtime | Node.js | — (**exact version not verifiable from repo**) | Render service |
| Database client | @supabase/supabase-js | `^2.111.0` | `backend/config/supabase.js` |
| Database | Supabase (PostgreSQL) | — (**remote, not verifiable from repo**) | `harvest`, `activities` tables |
| Legacy DB (unused) | MongoDB / Mongoose | `mongoose ^9.9.1` | `backend/config/db.js` (leftover, no route uses it) |
| AI provider | Google Gemini (REST) | — | `backend/controllers/aiController.js` |
| AI models | gemini-2.5-flash, gemini-3.5-flash-lite, gemini-3.6-flash (default order; `GEMINI_MODEL` overrides) | — | `aiController.js` |
| Speech recognition | Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) | Browser built-in | `src/lib/speech.ts`, `FarmerAssistant.tsx` |
| Text-to-speech | Web Speech API (`speechSynthesis`) | Browser built-in | `FarmerAssistant.tsx` |
| Voice recording (notes) | `MediaRecorder` + `getUserMedia` | Browser built-in | `AddActivityDialog.tsx` |
| GPS | `navigator.geolocation.getCurrentPosition` | Browser built-in | `src/routes/crops.new.tsx` |
| Reverse geocoding | BigDataCloud reverse-geocode-client API | — | `crops.new.tsx` |
| API communication | native `fetch` (frontend + backend), `node-fetch ^2.7.0` fallback | — | `harvest-store.tsx`, `aiController.js` |
| Build tooling | Vite 8 + Nitro (server output) | `vite ^8.1.5`, `nitro 3.0.260603-beta` | `vite.config.ts`, `@lovable.dev/vite-tanstack-config` |
| Package manager | npm (root + `backend/`) | lockfiles present (`package-lock.json`, `backend/package-lock.json`) | — |
| TypeScript | typescript | `^5.8.3` (strict) | `tsconfig.json` |
| Lint/format | ESLint 9 + Prettier | `^9.32.0`, `^3.7.3` | `package.json` scripts |
| Deployment (frontend) | Vercel | — (**project config not in repo; no `vercel.json`**) | — |
| Deployment (backend) | Render | — (**project config not in repo**) | `https://harvest-id-backend.onrender.com` |
| Version control | Git + GitHub | — | `03darshanpatil-code/harvest-id-passport`, branch `main` |
| Dev proxy | Vite dev server `/api` → `http://localhost:5000` | — | `vite.config.ts` |

### 3.2 Per-technology explanation (what / why / where / how it connects)

- **TanStack Start** — React metaframework that does SSR, file-based routing, and server functions. HarvestID uses it so the main route renders full HTML on the server (SEO + fast first paint), with `src/server.ts` as the custom server entry that wraps errors in a clean "This page didn't load" page.
- **TanStack Router** — type-safe file-based routing. Route files under `src/routes/` map 1:1 to URLs (`/crops/new`, `/crops/$cropId`, …). The generated `routeTree.gen.ts` ties them together; `src/router.tsx` creates the router with a React Query client.
- **Tailwind CSS 4** — utility-first styling with a custom design system in `src/styles.css` (`@theme` tokens: forest-green `primary`, gold `--gold` AI accent, `--shadow-soft`/`--shadow-lift`, dark-mode overrides under `.dark`).
- **shadcn/ui** — copy-paste-able React components built on Radix primitives. Provides buttons, dialogs, selects, tabs, badges, progress, skeleton, sonner toaster, etc. — the visual vocabulary of the whole app.
- **React Context (custom stores)** — `HarvestProvider` (`src/lib/harvest-store.tsx`) holds crops/activities/profile state and wraps every API call; `I18nProvider` (`src/i18n/index.tsx`) holds the current language and `t()` translator. Both are mounted in `src/routes/__root.tsx`.
- **React Query** — instantiated in `src/router.tsx` and provided in `__root.tsx`; available for server/query caching, though the app's primary data flow goes through the custom store's `fetch` layer.
- **Express backend** — a small, dependency-light REST API. Controllers normalize rows to camelCase for the frontend and implement a **degradation strategy**: if Supabase errors (e.g., missing table), they fall back to local JSON files (`backend/data/*.json`).
- **Supabase JS client** — `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` in `backend/config/supabase.js`; used for all crop/activity queries and inserts.
- **Google Gemini** — called via plain REST (`generateContent`) with an API key in the URL query (`?key=`), which is standard for the v1beta API. The key is read from `process.env.GOOGLE_API_KEY` server-side only.
- **Web Speech API** — speech recognition for assistant voice input + voice navigation commands, and `speechSynthesis` for reading AI answers aloud in the selected language (`speechTag`).
- **MediaRecorder / getUserMedia** — records farmer voice notes and camera photos in the Add Activity dialog, saved as base64 data URLs in the `activities` table.
- **html5-qrcode** — camera QR scanning; **dynamically imported** so the library never runs during SSR. React-qr-code renders the passport QR.
- **Vite + Nitro** — `vite build` compiles the frontend and emits a Nitro server bundle in `.output/` (the repo's default Nitro target is the Cloudflare module preset, per `vite.config.ts` comment and the generated `wrangler.json`); Vercel serves the SSR output.
- **npm** — the only package manager with lockfiles (`package-lock.json`, `backend/package-lock.json`); `install:all` installs both workspaces.

---

## 4. Project Directory Structure

```
harvest-id-passport/
├── backend/                        # Express REST API (deployed on Render)
│   ├── config/
│   │   ├── db.js                   # (LEGACY) Mongoose/MongoDB connector — unused by routes
│   │   └── supabase.js             # Supabase client (SUPABASE_URL + SUPABASE_ANON_KEY)
│   ├── controllers/
│   │   ├── harvestController.js    # Crops CRUD (Supabase + JSON-file fallback)
│   │   ├── activitiesController.js # Activities CRUD (+ score bump +2)
│   │   ├── profileController.js    # Farmer profile (JSON-file storage)
│   │   └── aiController.js         # Gemini chat + health (model fallback, safe errors)
│   ├── data/                       # Local JSON fallback stores (harvest.json, activities.json)
│   ├── routes/
│   │   ├── index.js                # GET / welcome + mounts /api/harvest
│   │   ├── harvest.js              # /api/harvest CRUD
│   │   ├── activities.js           # /api/activities CRUD
│   │   ├── profile.js              # /api/profile GET/PUT
│   │   └── ai.js                   # /api/chat POST + /health
│   ├── package.json                # backend deps/scripts (start: node server.js)
│   ├── server.js                   # Express app, CORS, 10mb JSON, mounts, error handler
│   ├── schema.sql                  # Supabase migration (tables/columns/RLS)
│   └── .env                        # gitignored — env values never committed
├── public/                         # Static assets served by the frontend host
│   ├── favicon.ico                 # Legacy favicon fallback
│   ├── logo/harvestID logo.jpeg    # ★ Official HarvestID logo (single source of truth, 1254×1254)
│   └── robots.txt                  # Allows all major crawlers
├── src/                            # Frontend (TanStack Start app)
│   ├── assets/                     # hero-farm.jpg, crop-tomato.jpg, crop-wheat.jpg, crop-chili.jpg
│   ├── components/
│   │   ├── AppLayout.tsx           # Sidebar + header + mobile nav shell (logo, language, QR, avatar)
│   │   ├── AddActivityDialog.tsx   # Add activity (note/photo/voice + AI enhance)
│   │   ├── CropCard.tsx            # Crop card + ScoreRing
│   │   ├── CropImage.tsx           # Resolver-driven crop photo w/ placeholder fallback
│   │   ├── FarmerAssistant.tsx     # Floating AI chatbot (voice in/out, nav commands, i18n)
│   │   ├── HarvestIDLogo.tsx       # ★ Reusable official-logo component
│   │   ├── QrCode.tsx              # QR generation (react-qr-code)
│   │   ├── QrScannerDialog.tsx     # Camera QR scanner (html5-qrcode, dynamic import)
│   │   ├── Timeline.tsx            # Vertical activity timeline
│   │   └── ui/                     # shadcn/ui primitives (button, dialog, select, …)
│   ├── hooks/use-mobile.tsx        # useIsMobile hook (shadcn)
│   ├── i18n/                       # 14 language catalogs + provider
│   │   ├── index.tsx               # I18nProvider, useI18n, LANGUAGES meta, localStorage
│   │   └── en|hi|kn|te|ta|ml|mr|bn|gu|pa|or|as|ur.ts
│   ├── lib/
│   │   ├── harvest-store.tsx       # ★ Store: crops/activities/profile state + API layer + API_BASE_URL
│   │   ├── crop-images.ts          # ★ Crop image catalog/resolver (150+ crops), passport URL, QR parse
│   │   ├── crop-l10n.ts            # Render-time crop name localization (20 crops × 13 languages)
│   │   ├── speech.ts               # Web Speech Recognition wrapper
│   │   ├── auto-speak.ts           # Persisted auto-speak preference (localStorage)
│   │   ├── error-page.ts           # Static "This page didn't load" HTML
│   │   ├── error-capture.ts        # console.error wrapper + captured-error store for SSR
│   │   ├── lovable-error-reporting.ts # Editor telemetry bridge (dev/preview only)
│   │   └── utils.ts                # cn() helper
│   ├── routes/                     # File-based routes (TanStack Router)
│   │   ├── __root.tsx              # Root shell: providers, favicon links, 404 + error boundary
│   │   ├── index.tsx               # Dashboard (greeting, stats, recent, AI nudge, QR scan)
│   │   ├── crops.index.tsx         # My Crops list (+ empty state with logo)
│   │   ├── crops.new.tsx           # Crop registration (GPS, photo, dates)
│   │   ├── crops.$cropId.tsx       # Crop details (hero, info, timeline/insights tabs)
│   │   ├── activities.tsx          # All activities feed
│   │   ├── analytics.tsx           # Recharts trend + score-by-crop
│   │   ├── passports.tsx           # Passport list w/ QRs
│   │   ├── passport.$cropId.tsx    # Public digital crop passport (read-only)
│   │   └── settings.tsx            # Profile, language, voice/auto-speak, preferences
│   ├── routeTree.gen.ts            # Generated route tree (do not hand-edit)
│   ├── router.tsx                  # createRouter(routeTree, QueryClient)
│   ├── server.ts                   # SSR entry: error wrapper + h3 swallow normalization
│   ├── start.ts                    # createStart + error/CSRF middleware
│   ├── main-styles?                # (no main.tsx — TanStack Start boots via router/server entries)
│   └── styles.css                  # ★ Design system: tokens, dark mode, motion utilities
├── components.json                 # shadcn/ui config
├── vite.config.ts                  # Lovable TanStack config + dev /api proxy
├── tsconfig.json                   # strict TS, @/* alias
├── eslint.config.js
├── package.json                    # root scripts/deps
└── .gitignore                      # node_modules, .output, .env*, tsbuildinfo, etc.
```

> Note: there is **no `src/main.tsx`** — this is a TanStack Start app; the client is bootstrapped by the framework from `src/router.tsx` / `src/start.ts` / `src/server.ts` (the Lovable Vite config wires this automatically).

### 4.1 Important file explanations

| File | Purpose / Responsibility | Communicates with |
|---|---|---|
| `src/routes/__root.tsx` | Root layout: `<html>` shell, head links (fonts, favicon, stylesheet), QueryClient + `I18nProvider` + `HarvestProvider` + `<Outlet />` + global `<FarmerAssistant />` + `<Toaster />`; 404 and error-boundary components | All routes, i18n, store |
| `src/lib/harvest-store.tsx` | Central state + fetch layer. Resolves `API_BASE_URL`, normalizes API rows, exposes `addCrop/updateCrop/deleteCrop/addActivity/generatePassport/saveProfile/refreshData` | Backend REST API, all components via `useHarvest()` |
| `src/i18n/index.tsx` | Language state, `t()` translator, `LANGUAGES` metadata, `localStorage` persistence, `document.documentElement.lang` sync | All catalogs; consumed by every component/page |
| `src/lib/crop-images.ts` | Canonical crop catalog → image URL; alias/singularization matching; `resolveCropKey`; `buildPassportUrl`; `parseCropIdFromQr`; `fileToResizedDataUrl` | `CropImage`, `CropCard`, `harvest-store`, `QrCode`, `AppLayout` |
| `src/components/FarmerAssistant.tsx` | Floating AI chat: send to `/api/chat`, voice input, voice nav commands (13 langs), TTS + auto-speak, per-assistant language selector | Backend `/api/chat`, `useI18n`, `useHarvest`, `speech.ts`, `auto-speak.ts` |
| `backend/server.js` | Express bootstrap: CORS, 10 MB JSON body, mounts 4 route groups, `/health`, JSON error handler | Routes, controllers |
| `backend/controllers/aiController.js` | Gemini REST calls with ordered model fallback, 45s timeout, safe error mapping, `/health` model listing | Google Generative Language API, `routes/ai.js` |
| `backend/schema.sql` | Idempotent Supabase migration (columns, table, index, RLS) | Supabase SQL editor (manual, one-time) |
| `vite.config.ts` | Lovable TanStack config; dev proxy `/api` → `localhost:5000`; server entry `src/server.ts` | Vite/Nitro build |
| `public/logo/harvestID logo.jpeg` | Official brand logo — single source of truth | `HarvestIDLogo.tsx`, `__root.tsx` favicon |

---

## 5. Development From Scratch — Workflow

Reconstructed from the repository (code, schema, scripts, Git history) as if building HarvestID from zero. **Note:** some historical phases (e.g. the original MongoDB prototype) are inferred from leftover code (`backend/config/db.js`, `mongoose` dependency) — they are labeled as such.

### PHASE 1 — Project planning
- **What**: Define a "digital crop passport" product for Indian smallholder farmers.
- **Why**: Buyers can't easily verify crop origin/care; farmers lack a simple record-keeping tool.
- **Inputs**: Problem statement; target user (regional-language farmer on a phone).
- **Outputs**: Feature list (crops, activities, passport, QR, AI, multilingual, voice, GPS).

### PHASE 2 — Requirements / PRD
- **What**: Core flows — register crop → record activities → generate passport → buyer scans QR.
- **Why**: Every feature exists to serve those flows.
- **Evidence in repo**: `src/routes/*` map 1:1 to these flows; `backend/schema.sql` encodes the data needed (variety, GPS, score, passport flag, media).

### PHASE 3 — Frontend architecture
- **What**: Choose TanStack Start (SSR React 19) + Tailwind 4 + shadcn/ui; file-based routes; Context stores for i18n and data.
- **Why**: SSR for reliability, reusable UI kit for speed, Context for global language.
- **Files**: `package.json`, `vite.config.ts`, `tsconfig.json`, `components.json`.

### PHASE 4 — Frontend implementation
- **What**: Build the shell (`AppLayout` sidebar/header/mobile nav), dashboard, crops CRUD UI, activities dialog, analytics, passports, settings.
- **Why**: Direct product surface.
- **Files**: `src/components/AppLayout.tsx`, `src/routes/*`, `src/components/*`.
- **Output**: Working UI wired to a typed store.

### PHASE 5 — Backend architecture
- **What**: Minimal Express REST API split into routes/controllers/config; Supabase as primary store with JSON-file fallback.
- **Why**: Simple, hostable on Render, resilient to schema drift.
- **Files**: `backend/server.js`, `backend/routes/*`, `backend/controllers/*`, `backend/config/supabase.js`.

### PHASE 6 — Backend implementation
- **What**: CRUD for crops and activities; profile GET/PUT; normalization layer (snake_case DB → camelCase API).
- **Why**: Decouple DB shape from frontend shape.
- **Files**: `harvestController.js`, `activitiesController.js`, `profileController.js`.

### PHASE 7 — Database design
- **What**: `harvest` (crops) + `activities` (child records, FK + cascade) tables; traceability `score`; media columns (`photo`, `audio` as TEXT data URLs).
- **Why**: Simple relational model matching the product.
- **Evidence**: `backend/schema.sql`.

### PHASE 8 — Supabase integration
- **What**: Create client from `SUPABASE_URL`/`SUPABASE_ANON_KEY`; apply `schema.sql` once; enable RLS with permissive anon policies.
- **Why**: Managed Postgres with REST-style JS client and no server config.
- **Evidence**: `backend/config/supabase.js`, `schema.sql` (see §9).

### PHASE 9 — API development
- **What**: Define and implement 16 endpoints (see §11) with `{success, data|error}` envelopes.
- **Why**: Single contract consumed by the frontend store.
- **Evidence**: `backend/routes/*`, `server.js`.

### PHASE 10 — Frontend ↔ Backend integration
- **What**: `harvest-store.tsx` `apiRequest()` against `API_BASE_URL` (env → dev localhost → production Render URL); dev proxy in `vite.config.ts`.
- **Why**: One switch for prod/dev.
- **Files**: `src/lib/harvest-store.tsx`, `vite.config.ts`.

### PHASE 11 — AI integration
- **What**: `POST /api/chat` → Gemini `generateContent` with system prompt, language, farmer context; model fallback list; `/api/chat/health` for diagnostics; `FarmerAssistant.tsx` UI.
- **Why**: Farmers need advice in their own language.
- **Files**: `backend/controllers/aiController.js`, `src/components/FarmerAssistant.tsx`.

### PHASE 12 — Multilingual system
- **What**: 14 catalogs (en + 13), `I18nProvider`, `t()` keys for every UI string, `localStorage` persistence, 3 selectors (header, settings, assistant).
- **Why**: Accessibility for regional-language farmers.
- **Files**: `src/i18n/*`, `src/lib/crop-l10n.ts`.

### PHASE 13 — Voice input/output
- **What**: Speech recognition (assistant + nav commands), TTS of AI answers, auto-speak toggle, `MediaRecorder` voice notes in activities.
- **Why**: Low-literacy / hands-free use.
- **Files**: `src/lib/speech.ts`, `src/lib/auto-speak.ts`, `FarmerAssistant.tsx`, `AddActivityDialog.tsx`.

### PHASE 14 — GPS/location
- **What**: One-shot `getCurrentPosition` in crop registration; reverse geocode via BigDataCloud; store in `harvest.gps`; pass into AI context.
- **Why**: Origin verification on the passport.
- **Files**: `src/routes/crops.new.tsx`, `backend/schema.sql`, `aiController.js`.

### PHASE 15 — QR scanning & digital passport
- **What**: `react-qr-code` generation (encodes full passport URL), `html5-qrcode` camera scanning, public read-only `/passport/$cropId` page, share/copy/print.
- **Why**: The buyer verification mechanism.
- **Files**: `QrCode.tsx`, `QrScannerDialog.tsx`, `passport.$cropId.tsx`, `crop-images.ts` (`buildPassportUrl`/`parseCropIdFromQr`).

### PHASE 16 — Crop image system
- **What**: Central catalog (150+ crops) of hotlink-safe Unsplash/Wikimedia URLs; alias + singular/plural matching; farmer-uploaded resized data URLs; `CropImage` component fallback.
- **Why**: No manual photo entry needed; honest placeholder for unknown crops.
- **Files**: `src/lib/crop-images.ts`, `src/components/CropImage.tsx`.

### PHASE 17 — UI/animation/branding
- **What**: Forest-green/gold design system, glass/soft-card utilities, float/fade/pulse/equalizer animations with `prefers-reduced-motion`, official logo integration + favicon.
- **Why**: Professional, trustworthy agri-tech feel.
- **Files**: `src/styles.css`, `HarvestIDLogo.tsx`, `public/logo/harvestID logo.jpeg`.

### PHASE 18 — Testing
- **What**: No automated test suites exist. Verification is manual/CI-style: `npx tsc -b --noEmit`, `vite build`, `node --check` on backend files, SSR worker render harness, live curl of `/health` and `/api/chat` (see §30).
- **Why**: Fast iteration on a small team.

### PHASE 19 — Git/GitHub workflow
- **What**: Feature commits on `main`, push to GitHub, Vercel auto-deploys on push (see §22 for the actual commit log).

### PHASE 20 — Vercel deployment
- **What**: Vercel builds the frontend (`vite build` → Nitro `.output/`), serves SSR + statics. No `vercel.json` in repo — default build settings/auto-deploy on push. (**Vercel project config itself not verifiable from repo.**)

### PHASE 21 — Render deployment
- **What**: Render runs the Express backend (`node server.js`), supplies `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_API_KEY` (and optional `GEMINI_MODEL`) as env vars. (**Render config not verifiable from repo**; endpoints verified live: `https://harvest-id-backend.onrender.com`).

### PHASE 22 — Production verification
- **What**: Health checks (`GET /health`, `GET /api/chat/health`), real chat POSTs in English + Kannada, SSR render of `/` and `/passport/1` from the built worker bundle, typecheck + build (see §30). Documented production fixes in §21.

---

## 6. Frontend Architecture

### 6.1 Entry points & bootstrapping

- **No `src/main.tsx`** — TanStack Start wires the client through the Lovable Vite config. The server entry is `src/server.ts` (explicitly configured in `vite.config.ts` → `tanstackStart.server.entry = "server"`).
- **`src/router.tsx`** creates `QueryClient` + `createRouter({ routeTree, context: { queryClient }, scrollRestoration: true })`.
- **`src/start.ts`** calls `createStart()` with an error middleware (renders `renderErrorPage()` on uncaught 500s) and a CSRF middleware scoped to server functions.
- **`src/server.ts`** default-exports the `fetch` handler: tries the framework server entry, and normalizes h3-swallowed `{"unhandled":true,"message":"HTTPError"}` JSON 500s into the HTML error page (with `error-capture.ts` recovering the original error/stack).
- **`src/routes/__root.tsx`** defines the shell: `<html lang="en">`, head links (styles, Google Fonts Poppins+Inter, favicon JPEG + ICO), and the provider tree:

```
QueryClientProvider
└─ I18nProvider (lang, t, locale, speechTag)
   └─ HarvestProvider (crops, activities, profile, CRUD actions)
      ├─ <Outlet />           → current route
      ├─ <FarmerAssistant />  → global floating chatbot
      └─ <Toaster />          → sonner toasts
```

### 6.2 Route table

| Route | Purpose | Main components | APIs used | Data used |
|---|---|---|---|---|
| `/` | Farmer dashboard: greeting, stats, recent activities, AI nudge, quick actions, crop cards, buyers-verify card | `AppLayout`, `CropCard`, `AddActivityDialog`, `QrScannerDialog` | `GET /api/harvest`, `GET /api/activities`, `GET /api/profile` | crops, activities, profile |
| `/crops` | Crop list / empty state | `AppLayout`, `CropCard`, `HarvestIDLogo` | (store data) | crops |
| `/crops/new` | Crop registration (GPS + photo) | `AppLayout`, form fields | `POST /api/harvest`; BigDataCloud reverse-geocode; browser geolocation | profile (prefill) |
| `/crops/$cropId` | Crop detail: hero image, info grid, timeline/insights tabs | `AppLayout`, `CropImage`, `Timeline`, `ScoreRing`, `AddActivityDialog` | (store data) | crop, its timeline |
| `/activities` | All field activities feed + per-crop badges | `AppLayout`, `Timeline`, `Badge` | (store data) | activities, crops |
| `/analytics` | Monthly documentation trend + score by crop (Recharts) | `AppLayout`, `LineChart`, `BarChart` | (store data) | activities, crops |
| `/passports` | Passport list with live QR previews | `AppLayout`, `QrCode` | (store data) | crops |
| `/passport/$cropId` | **Public** digital crop passport (read-only) | `CropImage`, `QrCode`, `Timeline`, `ScoreRing`, `HarvestIDLogo` | `PUT /api/harvest/:id` (passport=true) | crop, timeline |
| `/settings` | Profile, language, voice/auto-speak, preferences | `AppLayout`, `Select`, `Switch` | `GET/PUT /api/profile` | profile |
| *any* | 404 page | `NotFoundComponent` | — | i18n |
| *any* | Error boundary | `ErrorComponent` (+ telemetry) | — | i18n |

### 6.3 State management

- **`useHarvest()`** (`harvest-store.tsx`): global crops, activities, profile, loading/error flags, and actions (`refreshData`, `addCrop`, `updateCrop`, `deleteCrop`, `addActivity`, `generatePassport`, `saveProfile`, `refreshProfile`). Loads data on mount. All actions update local state after a successful API call.
- **`useI18n()`** (`i18n/index.tsx`): `lang`, `setLang`, `t()`, `locale`, `speechTag`.
- **`useSyncExternalStore`** for the persisted auto-speak boolean (`auto-speak.ts`), shared between the assistant header and Settings.
- `useState`/`useMemo`/`useCallback` for local UI state; **no Redux/Zustand** — React Context is the store.

### 6.4 API communication

- `API_BASE_URL` resolution in `harvest-store.tsx`:
  1. `VITE_API_BASE_URL` (trimmed, trailing slash removed) if set;
  2. dev (`import.meta.env.DEV`) → `http://127.0.0.1:5000`;
  3. production → `https://harvest-id-backend.onrender.com`.
- `apiRequest<T>()` wraps `fetch`, sets `Accept: application/json`, parses JSON (or raw text), and throws the backend `error` message on non-OK statuses.
- Dev-only `/api` proxy in `vite.config.ts` forwards to `http://localhost:5000`.

### 6.5 Loading / error / empty states

- Loading: inline dashed-border panels (`dashboard.loadingFarmData`, `crops.loading`, `activities.loading`, `common.loadingData`), skeletons on passport generation.
- Error: red `destructive` banner with a Retry button (dashboard/crops/analytics/settings), toast errors on actions.
- Empty: styled empty states for crops (logo + CTA), analytics, timeline, passport (generate CTA), all localized.

### 6.6 Responsive behavior

- Desktop (lg+): fixed 256px sidebar with logo + nav; header shows page title + compact logo (xl).
- Mobile/tablet: logo in the top header (compact), **bottom navigation bar** with 5 items + centered raised "+" register button; QR scanner button and language selector remain in the header.
- Assistant floats bottom-right (`sm:bottom-6 sm:right-6`, bottom-24 on mobile above the nav bar).

### 6.7 Dark/light mode

- Defined via CSS tokens in `src/styles.css` under `:root` (light) and `.dark` (dark overrides). The `dark` custom variant is `&:is(.dark *)`. No theme toggle is exposed in the UI (**not verifiable how it is toggled**); the logo artwork itself is a fixed-color JPEG and remains readable on both themes.

### 6.8 Animations & branding

- See §18 (motion system) and §19 (logo system).

---

## 7. Every Major Feature — Technical Breakdown

> Format: User action → Frontend component → State/processing → API request → Backend route → Controller → DB op → Response → Frontend update → Final UI result. Only features present in the repository are documented.

### 7.1 Farmer profile
1. Farmer opens **Settings** (`/settings`).
2. `SettingsPage` reads `profile` from `useHarvest()` (fetched from `GET /api/profile`).
3. Form fields edited locally; "Save changes" calls `saveProfile(form)`.
4. `PUT /api/profile` → `routes/profile.js` → `profileController.updateProfile` → writes `backend/data/profile.json` (no Supabase) → returns normalized profile.
5. Store updates `profile`; toast "Profile saved"; profile prefill now applies to crop registration and appears on passports.

### 7.2 Dashboard
1. Farmer lands on `/` → `Dashboard` (`routes/index.tsx`).
2. `useHarvest()` loads crops + activities + profile (3 parallel GETs).
3. Time-aware greeting via `greetingKeyForHour(now.getHours())` (05–11 Morning, 12–16 Afternoon, 17–20 Evening, 21–04 Night), refreshed every 60s.
4. Stats (total/active/harvest-ready/avg score), recent 4 activities, "AI recommendation" card for the crop with the oldest activity, quick-action buttons, 3 crop cards, buyer-verification card.
5. QR scanner button opens `QrScannerDialog`; a recognized code → `parseCropIdFromQr` → navigate to `/passport/$cropId`.

### 7.3 Crop registration
1. `/crops/new` form (`RegisterCrop`), prefilled with profile name/farm/location.
2. Optional photo: `attachImage` validates type/size (≤8 MB) → `fileToResizedDataUrl` (canvas resize) → preview.
3. Optional GPS: "Use my location" → one-shot `getCurrentPosition` → `"lat, lng"` into `gps` → best-effort BigDataCloud reverse geocode fills `location`.
4. Submit validates name + location → `addCrop()` → `POST /api/harvest` → `harvestController.createHarvest` (full payload first; retries base-only if table lacks columns; JSON-file fallback last) → 201 with row.
5. Store prepends crop; navigate to `/crops/$cropId`; toast "Crop registered" with new ID.

### 7.4 Crop editing / deletion
- **Edit**: `updateCrop(cropId, updates)` → `PUT /api/harvest/:id` → `harvestController.updateHarvest` (partial payload; JSON-file fallback only if the row exists there; never reports success if nothing persisted) → store replaces the crop in the list.
- **Delete**: `deleteCrop` → `DELETE /api/harvest/:id` → `deleteHarvest` (Supabase, or JSON-file fallback) → store removes crop + its activities.
- **Status/stage**: `normalizeStage()` maps stored `status` text → `Sowing | Growing | Flowering | Harvest Ready | Harvested` on read; stage badge shown on cards/details/passport.

### 7.5 Crop images (dynamic + custom)
1. Crop row arrives with `name`/`variety`/`category` and optional stored `image`.
2. `harvest-store.normalizeCrop` calls `resolveCropImage(name, variety, category, customDataUrl)` — only `data:` URLs from the farmer are used; catalog images are resolved at render time from the name.
3. `CropImage` renders the resolved URL; unknown crops → `CROP_IMAGE_UNAVAILABLE` sentinel → honest placeholder; broken URL → `onError` → placeholder (see §17).

### 7.6 Crop details
1. `/crops/$cropId` → `useCrop(cropId)` filters store by id, builds sorted timeline.
2. Hero image + name + stage + ScoreRing + passport status; info grid (farmer, farm, location, area, planted, expected harvest).
3. Tabs: **Timeline** (`Timeline`) and **AI insights** (localized AI summary text + documentation-quality progress bars + buyer read-only note). Add activity button opens `AddActivityDialog`.

### 7.7 Activity tracking (sowing/irrigation/fertilizer/pest/weeding/flowering/photo/harvest)
1. `AddActivityDialog` (dashboard, crop details, or passport flows): choose type (8 kinds), write note, optionally attach photo (≤5 MB) / record voice (`MediaRecorder`), press **AI Enhance**.
2. AI Enhance: keyword-guess map (`guesses[]`) detects fertilizer/irrigation/pest/… from the note → sets kind, title (localized label), cleaned description, category, confidence (98% or 86%), marks `aiEnhanced`.
3. Save → `addActivity` → `POST /api/activities` → `activitiesController.createActivity` (normalizes kind; inserts; bumps crop `score` +2, capped at 99) → 201.
4. Store prepends activity and bumps the crop score locally; timeline updates; toast "Activity recorded".

### 7.8 Digital crop passport
1. `generatePassport(cropId)` → `PUT /api/harvest/:id` with `{passport:true}` → controller updates row → store only confirms when the returned row has `passport:true` (never fakes it).
2. `/passport/$cropId` renders the read-only page (see §16): brand header, identity card, QR, traceability score, AI summary, timeline, footer brand, and a celebration dialog with Download PDF (window.print), Share QR (clipboard), View passport.

### 7.9 QR generation / scanning / sharing
- **Generation**: `QrCode.tsx` → `react-qr-code` with `buildPassportUrl(cropId)` (absolute app URL + `/passport/<id>`; never a raw id or localhost).
- **Scanning**: `QrScannerDialog` dynamically imports `html5-qrcode`, starts camera (`facingMode: "environment"`, fps 10, 220px box), maps DOM errors to localized messages (permission/no-camera/unknown), stops on first decode.
- **Share/print**: copy URL to clipboard, or `window.print()` for Save-as-PDF.

### 7.10 Analytics
1. `AnalyticsPage` derives two datasets client-side: monthly activity counts (locale-formatted month labels, last 8 buckets) and per-crop traceability scores (localized crop names).
2. Renders Recharts `LineChart` (trend) + `BarChart` (score by crop) with theme CSS variables for axis/tooltip colors.

### 7.11 AI Farmer Assistant
See §12 for the full flow (send → `/api/chat` → Gemini → reply → optional TTS, voice nav commands, per-assistant language).

### 7.12 Multilingual interface & language selectors
See §13 (one shared `lang` state; selectors in header, settings, assistant; render-time crop-name localization; everything else via `t()`).

### 7.13 Voice input / navigation / AI voice output
See §14 (recognition → transcript → nav-command match or fill input; TTS with `speechTag`, auto-speak toggle; voice-note recording in activities).

### 7.14 GPS/location detection & location-aware AI
See §15 (one-shot GPS at registration, reverse geocode, stored `gps`, AI context includes `gps`/`location`).

### 7.15 Time-aware dashboard greeting
- `greetingKeyForHour()` in `routes/index.tsx`; keys `dashboard.greetingMorning/Afternoon/Evening/Night` in all 14 catalogs; re-evaluated every minute via `setInterval`.

### 7.16 Premium UI animations
- CSS/SVG-only motion (see §18): floating field emojis, gold pulse ring on the assistant orb, animated equalizer while speaking, fade-up cards, hover lift. All disabled under `prefers-reduced-motion`.

### 7.17 Logo / branding
- See §19: one official JPEG asset + one reusable component used in sidebar/headers/mobile header/passport/assistant/crops empty state + favicon.

### 7.18 Settings
- Profile fields, language selector, voice (auto-speak switch), preferences toggles (reminders, AI formatting, public sharing) — persisted via `PUT /api/profile`.

---

## 8. Database Architecture

**Provider**: Supabase (PostgreSQL). **Evidence**: `backend/config/supabase.js`, `backend/schema.sql`, controllers. Exact remote DB contents are **not verifiable from the repository**.

### 8.1 Tables & columns (from `backend/schema.sql` + controllers)

**`harvest`** — one row per registered crop.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint (existing) | PK (implicit in Supabase default table; serial) |
| `farmer_name` | text (existing) | Farmer's name |
| `crop_name` | text (existing) | Canonical farmer-entered crop name (never translated in DB) |
| `location` | text (existing) | Farm location text |
| `planting_date` | date/text (existing) | Planted on |
| `harvest_date` | date/text (existing) | Expected harvest |
| `status` | text (existing) | Growing/Sowing/… (mapped to `stage` client-side) |
| `created_at` | timestamptz (existing) | Row creation |
| `variety` | text (added) | e.g. "Cherry Tomato" |
| `category` | text (added) | e.g. "Vegetable" |
| `farm_name` | text (added) | Farm display name |
| `gps` | text (added) | `"lat, lng"` string |
| `area` | text (added) | Farm size |
| `score` | integer (added, default 70) | Traceability score (capped at 99) |
| `passport` | boolean (added, default false) | Passport issued flag |
| `image` | text (added) | Farmer-uploaded image (data URL) — only `data:` URLs are trusted |
| `note` | text (added) | Free note |

**`activities`** — one row per field record (child of `harvest`).

| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `crop_id` | BIGINT | **FK → `harvest(id)` ON DELETE CASCADE** |
| `kind` | TEXT default 'sowing' | one of sowing/irrigation/fertilizer/pest/weeding/flowering/photo/harvest |
| `title` | TEXT default 'Field activity' | Localized label or custom |
| `note` | TEXT default '' | The field note |
| `date` | TIMESTAMPTZ default now() | Activity date |
| `media` | TEXT default 'text' | text/photo/voice/mixed |
| `ai_enhanced` | BOOLEAN default false | AI formatted |
| `ai_summary` | TEXT | Category line e.g. "Nutrition · recorded by farmer" |
| `confidence` | INTEGER | AI confidence % |
| `photo` | TEXT | Base64 data URL (≤5 MB) |
| `audio` | TEXT | Base64 data URL voice note |
| `created_at` | TIMESTAMPTZ default now() | |

**Index**: `idx_activities_crop_id` on `activities(crop_id)`.

### 8.2 ER-style relationship diagram

```
harvest (crops)
   │  1
   │  │  (crop_id → harvest.id, ON DELETE CASCADE)
   │  ▼
   ▼  n
activities (records)
```

- `activities.crop_id` → `harvest.id` (one-to-many, cascade delete: deleting a crop deletes its activities).
- Profile has **no table** — it is stored in a JSON file on the backend (`backend/data/profile.json`), which the repository shows is created at runtime (default profile in `profileController.js`).

### 8.3 RLS policies (from `schema.sql`)

- `ALTER TABLE public.harvest ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;`
- `anon_all_harvest`: `FOR ALL TO anon USING (true) WITH CHECK (true)`
- `anon_all_activities`: `FOR ALL TO anon USING (true) WITH CHECK (true)`

> ⚠️ These are deliberately permissive so the anon key (used by the backend) can read/write. There is **no user authentication** in the application (see §20, §32).

### 8.4 CRUD flow (data layer)

- **Create**: `supabase.from("harvest").insert([payload]).select("*")` (retry with base-only columns on column-missing errors; JSON-file fallback last).
- **Read**: `select("*").order("created_at", {ascending:false})`; single: `.eq("id", id).single()`.
- **Update**: `.update(payload).eq("id", id).select("*")` (partial payloads only).
- **Delete**: `.delete().eq("id", id)`.
- **Activities**: same pattern with `cropId` filter support (`?cropId=`), plus score bump (+2, cap 99) on create.

---

## 9. Supabase Integration

1. **Initialization** — `backend/config/supabase.js`:
   ```js
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
   ```
   `dotenv` is loaded in both `supabase.js` and `server.js`.
2. **Credentials** — read from the backend's environment (Render env vars / local `.env`). **Never** shipped to the frontend; the frontend talks to the backend only.
3. **Queries** — the supabase-js query builder (`from().select().eq().order()`), awaited in controllers.
4. **Inserts** — `insert([payload]).select("*")`; harvest has a two-tier insert (full payload, then base-only retry) so an un-migrated table still records crops.
5. **Updates** — `update(payload).eq(id).select()`; partial payloads built from present fields only.
6. **Deletes** — `delete().eq(id)`.
7. **Retrieval** — normalized to camelCase API rows by `normalizeCrop`/`normalizeActivity` before hitting the frontend.
8. **Security** — anon-key + RLS policies (see §8.3). **No Supabase Auth is used** — the app is not per-user authenticated.
9. **Storage** — **Supabase Storage is NOT used.** Images and audio are base64 data URLs stored in TEXT columns (`harvest.image`, `activities.photo/audio`); catalog crop photos are hotlinked from Unsplash/Wikimedia.
10. **Env handling** — `SUPABASE_URL`, `SUPABASE_ANON_KEY` in backend env only; `.env` is gitignored.

---

## 10. Backend Architecture

### 10.1 Request pipeline

```
Client (browser, Vercel)
   ↓ fetch /api/*
Express server.js (CORS → json(10mb) → routes)
   ↓
Route (routes/*.js)
   ↓
Controller (controllers/*.js)
   ↓
Supabase client (config/supabase.js)  [or JSON-file fallback in data/*.json]
   ↓
PostgreSQL (Supabase)
   ↓
Response { success, data | error } → Frontend store
```

### 10.2 Backend module table

| Module | File | Responsibility |
|---|---|---|
| App bootstrap | `backend/server.js` | `cors()`, `express.json({limit:"10mb"})`, mounts routes, `/`, `/health`, `/add-test`, JSON error handler, listens on `PORT` |
| Supabase client | `backend/config/supabase.js` | Single shared client |
| Legacy DB | `backend/config/db.js` | Mongoose connect (`MONGODB_URI`) — **leftover prototype code, not imported by server.js** |
| Crops routes | `backend/routes/harvest.js` | GET/POST `/`, GET/PUT/DELETE `/:id` |
| Activities routes | `backend/routes/activities.js` | GET/POST `/` (GET supports `?cropId=`), GET/PUT/DELETE `/:id` |
| Profile routes | `backend/routes/profile.js` | GET `/`, PUT `/` |
| AI routes | `backend/routes/ai.js` | POST `/`, GET `/health` |
| Welcome route | `backend/routes/index.js` | GET `/` message; mounts harvest router (legacy path group) |
| Harvest controller | `backend/controllers/harvestController.js` | CRUD + normalization + JSON-file fallback + two-tier insert |
| Activities controller | `backend/controllers/activitiesController.js` | CRUD + kind whitelist + fallback + score bump |
| Profile controller | `backend/controllers/profileController.js` | JSON-file-backed profile (default `Ramesh Kumar`/`Green Valley Farms`) |
| AI controller | `backend/controllers/aiController.js` | Gemini chat, model fallback, `/health` model listing, safe errors |
| Schema | `backend/schema.sql` | Idempotent migration + RLS |
| Fallback data | `backend/data/*.json` | Local stores used when Supabase fails/table missing |

### 10.3 Middleware & infra details

- **CORS**: `cors()` — permissive (all origins). Configured for a separate frontend origin.
- **JSON body limit**: `10mb` (raised from the 100 kb default to support base64 photos/audio — production 413 fix, see §21).
- **Error handling**: final Express error middleware maps `entity.too.large`/413 → 413 JSON `"Request body too large — keep photos under ~5 MB."`; otherwise `err.status || 500` with message.
- **Validation**: `Number.isFinite(id)` guards on `:id` routes; activity `kind` whitelist; AI message required + ≤4000 chars; profile/CRUD accept missing optional fields gracefully.
- **HTTP status codes used**: 200 (ok), 201 (created), 400 (invalid id / bad request), 404 (not found), 413 (too large), 429 (AI rate limit), 500 (internal), 502 (provider/network), 503 (AI not configured), 504 (AI timeout).
- **Environment variables**: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`, optional `GEMINI_MODEL` (comma-separated override). `MONGODB_URI` exists only for the legacy `config/db.js`.

---

## 11. Complete API Documentation

Base URL (production): `https://harvest-id-backend.onrender.com`
Base URL (dev): `http://127.0.0.1:5000` (or `http://localhost:5000` via the Vite proxy).

All responses use the envelope `{ "success": boolean, "data"?: …, "error"?: string, "message"?: string }`.

### 11.1 Endpoint table

| Method | Endpoint | Purpose | Controller | DB op |
|---|---|---|---|---|
| GET | `/` | API welcome message | (inline) | — |
| GET | `/health` | Liveness | (inline) | — |
| GET | `/add-test` | Dev: insert sample crop | (inline) | insert `harvest` |
| GET | `/api/harvest` | List crops (newest first) | `harvestController.getHarvests` | select all |
| GET | `/api/harvest/:id` | Single crop | `getHarvestById` | select by id |
| POST | `/api/harvest` | Create crop | `createHarvest` | insert (full→base fallback→JSON file) |
| PUT | `/api/harvest/:id` | Update crop (partial) | `updateHarvest` | update by id |
| DELETE | `/api/harvest/:id` | Delete crop (cascades activities) | `deleteHarvest` | delete by id |
| GET | `/api/activities` | List activities (`?cropId=` filters) | `activitiesController.getActivities` | select (filtered) |
| GET | `/api/activities/:id` | Single activity | `getActivityById` | select by id |
| POST | `/api/activities` | Create activity (+2 score) | `createActivity` | insert + score update |
| PUT | `/api/activities/:id` | Update activity (partial) | `updateActivity` | update by id |
| DELETE | `/api/activities/:id` | Delete activity | `deleteActivity` | delete by id |
| GET | `/api/profile` | Get farmer profile | `profileController.getProfile` | JSON file read |
| PUT | `/api/profile` | Update profile | `updateProfile` | JSON file write |
| POST | `/api/chat` | AI farm assistant | `aiController.chat` | Gemini API call |
| GET | `/api/chat/health` | AI config + accessible models | `aiController.health` | Gemini models list |

> Note: `routes/index.js` also mounts `/api/harvest` under a `router.use("/harvest")` legacy path — the active mount is `app.use("/api/harvest", …)` in `server.js`.

### 11.2 Selected endpoint details

**POST /api/harvest**
- Body: `{ farmer_name|farmer, crop_name|name, location, planting_date|plantedOn, harvest_date|harvestOn, status, variety, category, farm_name|farmName, gps, area, score, passport, image, note }` (all optional except name/location enforced client-side).
- Success (201): `{ success: true, message: "Harvest record created successfully", data: [normalizedCrop] }`
- Errors: 400 invalid id; 500 fallback/other.

**POST /api/activities**
- Body: `{ crop_id|cropId, kind, title, note, date, media, ai_enhanced|aiEnhanced, ai_summary|aiSummary, confidence, photo, audio }`
- Side effect: crop `score` += 2 (cap 99).
- Success (201): `{ success: true, data: normalizedActivity }`
- Errors: 400/404/500.

**POST /api/chat**
- Body: `{ message: string, lang?: "en"|"hi"|… (or "language"), context?: { cropName?, variety?, stage?, gps?, location?, date?, season?, crops?[] } }`
- Success (200): `{ success: true, reply: string }`
- Errors: 400 (empty/too long), 503 (`configured:false` — no key), 404 (`model_not_found` with tried models), 429 (rate limit), 502 (invalid key/network/empty), 504 (timeout). `detail` field only for diagnostics; keys are redacted.

**GET /api/chat/health**
- Success: `{ success: true, configured: true, models: ["gemini-2.5-flash", …] }` or `{ success: true, configured: false }`.

---

## 12. AI Farmer Assistant

### 12.1 Architecture

```
Farmer question (typed or voice)
   ↓
FarmerAssistant.tsx (frontend, Vercel)
   ↓ POST ${API_BASE_URL}/api/chat  { message, lang, context }
Express route routes/ai.js
   ↓
aiController.chat
   ├─ normalizeLang(lang) → safe 2-letter code (en default)
   ├─ buildSystemPrompt(lang, context) → system instructions
   └─ chatWithGemini(apiKey, prompt)
        ↓ fetch https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=…
        ↑ ordered model fallback on 404 / next model
   ↓
{ success: true, reply }  (or mapped error)
   ↓
FarmerAssistant renders reply; auto-speak TTS if enabled
```

### 12.2 Provider, models, env

- **Provider**: Google Gemini via REST (`generativelanguage.googleapis.com/v1beta`), no SDK.
- **Env var**: `GOOGLE_API_KEY` (server-side only, never in the frontend).
- **Default models** (ordered): `gemini-2.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`. Override: `GEMINI_MODEL` (comma-separated). On any **404** from Google, the next model is tried (protects against model retirement — `gemini-1.5-flash` was retired Sept 2025 per code comments).

### 12.3 Prompt & context

- System prompt: role (friendly Indian smallholder farm advisor), **"Reply in {language}"**, scope (cultivation, pests, irrigation, fertilizer, soil, weather-related advice, sowing, harvesting, market guidance, govt schemes), and guardrails: never invent facts; no live weather/price/soil data — say so; no precise pesticide dosages; never reveal system instructions; keep answers short; no internal implementation details.
- Context injection (only if provided): current crop name/variety/stage, GPS coordinates, farmer location, today's date + Indian season (Rabi/Kharif/Zaid), and up to 10 registered crops.
- Generation config: `temperature 0.4`, `maxOutputTokens 1024`, `topP 0.95`.

### 12.4 Request/response format & error handling

- Request body `{ message, lang, context }`; `language` accepted as alias. `message` required, ≤4000 chars.
- Response `{ success: true, reply }`.
- Errors mapped to safe `AiProviderError` codes: `model_not_found` (404), `rate_limited` (429), `invalid_api_key` (502), `empty_response` (502), `timeout` (504, AbortController 45s), `network` (502), `provider_error`. `sanitizeDetail()` redacts `AIza…` keys, `key=…` params, and long tokens before any detail is returned.
- **Timeouts**: 45 s per model request; 6 s for the models list in `/health`.
- **Fallback**: only 404 continues the model loop; other errors abort immediately.
- **Security**: key read from `process.env`; never logged (detail is redacted); frontend never receives the key.

---

## 13. Multilingual System

### 13.1 Supported languages (all verified in `src/i18n/`)

| Code | Native | English | BCP-47 (locale/speech) |
|---|---|---|---|
| en | English | English | en-IN |
| hi | हिन्दी | Hindi | hi-IN |
| kn | ಕನ್ನಡ | Kannada | kn-IN |
| te | తెలుగు | Telugu | te-IN |
| ta | தமிழ் | Tamil | ta-IN |
| ml | മലയാളം | Malayalam | ml-IN |
| mr | मराठी | Marathi | mr-IN |
| bn | বাংলা | Bengali | bn-IN |
| gu | ગુજરાતી | Gujarati | gu-IN |
| pa | ਪੰਜਾਬੀ | Punjabi | pa-IN |
| or | ଓଡ଼ିଆ | Odia | or-IN |
| as | অসমীয়া | Assamese | as-IN |
| ur | اردو | Urdu | ur-IN |

### 13.2 Architecture

- **Catalogs**: `en.ts` is the source of truth (typed keys); the other 13 files provide `Record<TranslationKey, string>`.
- **Provider** (`src/i18n/index.tsx`): `I18nProvider` exposes `{ lang, setLang, t, locale, speechTag }`. `t(key, params)` looks up the active catalog, falls back to English, then to the key itself; interpolates `{param}` placeholders.
- **Persistence**: `localStorage` key `harvestid-language`; applied **after hydration** (initial render always English so SSR/hydration match), then synced to `document.documentElement.lang`.
- **Selectors (all share the same state)**: header dropdown (`AppLayout.tsx`), Settings card (`settings.tsx`), and a compact dropdown inside `FarmerAssistant` — changing any one re-renders the entire app immediately, across routes and after refresh.
- **Crop/activity names**: `src/lib/crop-l10n.ts` maps canonical crop keys (e.g. `tomato`) to localized display names for 20 common crops × 13 languages **at render time only** — farmer-entered names in the DB are never rewritten, and `resolveCropKey` still receives the original name so the photo resolver keeps working. Activity kinds use `activity.kind.*` keys.
- **What is translated**: navigation, dashboard, crops, registration, details, activities, timeline, analytics, passports, passport page, settings, QR scanner, AI assistant, voice labels, empty/loading/error states, toasts, aria-labels, 404/error boundary, time-ago strings, dates (via `locale`).
- **Not translated**: internal keys, API routes, IDs, URLs, DB values (canonical `stage`/`kind` remain English; localized only in the UI labels).

---

## 14. Voice System

### 14.1 Components

- **Speech recognition** — `src/lib/speech.ts`: typed wrapper around `SpeechRecognition`/`webkitSpeechRecognition`; returns `null` when unsupported (callers fall back to typing).
- **AI voice input** — `FarmerAssistant.startListening()`: sets `recognition.lang = speechTag` (e.g. `kn-IN`), single-shot; on result → `handleTranscript`.
- **Voice navigation** — `handleTranscript` first tries `matchNavCommand(transcript, lang)`: per-language phrase tables (`NAV_COMMANDS`) for Dashboard/Crops/Register/Activities/Analytics/Passports/Settings; a match navigates and toasts the destination in the current language.
- **Text-to-speech** — `speakMessage()`: `SpeechSynthesisUtterance` with `utterance.lang = speechTag`; speak/stop per message; auto-speak toggle (persisted `harvestid-autospeak`, shared with Settings via `useSyncExternalStore`).
- **Voice notes (activities)** — `AddActivityDialog.startVoice()`: `getUserMedia({audio:true})` + `MediaRecorder`, saved as base64 data URL in `activities.audio`, played back with `<audio controls>`.
- **Permissions/errors**: recognition `not-allowed`/`service-not-allowed` → localized mic-permission toast; `MediaRecorder`/`getUserMedia` failures → localized messages; unsupported browsers → `assistant.micUnsupported` / `activity.voiceUnsupported`.
- **Compatibility**: all Web Speech APIs are browser-dependent (best on Chrome/Chromium); the app degrades gracefully to text everywhere.

### 14.2 Voice workflow diagram

```
Farmer taps mic
   ↓
getSpeechRecognition() (lang = selected speechTag)
   ↓ onresult
Transcript
   ├─ matches a nav command? → navigate + toast (localized)
   └─ otherwise → fill input box (farmer reviews → send)
       ↓
POST /api/chat → Gemini reply (in selected language)
   ↓
reply rendered; if autoSpeak → speechSynthesis.speak(reply, lang=speechTag)
   ↓
Stop button / panel close / route change → cancel()
```

---

## 15. GPS & Location System

- **Capture**: `crops.new.tsx` "Use my location" → one-shot `navigator.geolocation.getCurrentPosition` (never continuous tracking), `{ enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }`.
- **Permissions**: error codes mapped — `1` → `gps.denied`, `3` → `gps.timeout`, else `gps.unavailable` (all localized); geolocation missing → `gps.unsupported`. Failure never blocks registration (coordinates optional).
- **Coordinates**: stored as `"lat, lng"` (6 decimals) in `harvest.gps`.
- **Reverse geocoding**: best-effort `fetch` to `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=…&longitude=…` → fills `location` as `city/locality, principalSubdivision, countryName`. Failure ignored (coordinates remain).
- **Location-aware AI**: the assistant's `context` includes `{ gps, location, date, season, crops[] }`, injected into the Gemini system prompt so answers reference the crop's GPS and farm region.
- **Origin verification**: passport shows the GPS row (or "Not provided"); crop details' "Origin verification" quality bar uses `gps ? 99 : 70`.

---

## 16. QR + Digital Crop Passport

### 16.1 Workflow

```
Crop registered (harvest row created, id = e.g. 42)
   ↓ farmer clicks "Generate passport" (or opens /passport/42 and clicks Generate)
PUT /api/harvest/42 { passport: true }  → harvest.passport = true (confirmed only on success)
   ↓
Passport page /passport/42
   ↓ react-qr-code encodes buildPassportUrl("42") = <app origin>/passport/42
   ↓ farmer shares (clipboard) / prints (Save as PDF)
Buyer scans QR (browser or in-app scanner)
   ↓ html5-qrcode decodes → parseCropIdFromQr extracts id → navigate to /passport/42
   ↓
Public read-only passport renders: identity, QR, score, AI summary, timeline
```

### 16.2 Details

- **Generation**: `QrCode.tsx` (react-qr-code, white rounded tile). Value is **always the full passport URL** built by `buildPassportUrl()` in `crop-images.ts` — never a bare id, never localhost.
- **Scanning**: `QrScannerDialog` — dynamic `import("html5-qrcode")` (SSR-safe), rear camera, fps 10, 220×220 box, auto-stop after first decode, localized camera/permission errors, retry support.
- **Parsing**: `parseCropIdFromQr` extracts the numeric id from any passport URL format.
- **Public/private**: the passport route is fully public/read-only (shares via URL). The farmer assistant is **hidden on `/passport/*`** (`hidden = pathname.startsWith("/passport/")`) so buyers see a clean document.
- **Security considerations**: no auth; data exposure is by design (public verification page). RLS is permissive. Passport content is derived from the crop row + its activities.
- **Sharing/printing**: copy link, `window.print()` for PDF, celebration dialog with Download PDF / Share QR / View passport.

---

## 17. Crop Image System

### 17.1 Architecture (`src/lib/crop-images.ts`)

1. **Catalog**: `CATALOG` — ~150 canonical crops mapped to stable, hotlink-safe URLs (Unsplash CDN for the original set; permanent `upload.wikimedia.org` URLs for the rest).
2. **Normalization**: lowercase/trim, singularization, punctuation handling, and an `ALIASES` map (e.g. `brinjal`→`eggplant`, `lady finger`→`okra`, `bhindi`→`okra`, `makka`→`maize`, `angoor`→`grapes`, Hindi/regional synonyms) so whatever the farmer typed resolves to the canonical key.
3. **`resolveCropKey(name, variety)`** — canonical key or `null`; used by both the image resolver and the name localizer (keeps them consistent).
4. **`resolveCropImage(name, variety, category, customImage)`** — priority: farmer-uploaded `data:` URL → catalog match → `CROP_IMAGE_UNAVAILABLE` sentinel.
5. **`fileToResizedDataUrl(file)`** — client-side canvas resize → compact data URL (used at crop registration).
6. **UI** (`CropImage.tsx`): renders the resolved URL; sentinel or `onError` → honest localized "Crop image unavailable" placeholder; never crashes; never shows a different crop's photo.

### 17.2 Why it scales

Adding a crop = one catalog line (or one alias) — no component changes. Regional spellings are absorbed by the alias layer. Farmer photos always win. Broken images degrade to placeholders instead of wrong photos.

---

## 18. UI / UX / Animation System

- **Design system** (`src/styles.css`): Tailwind 4 `@theme` tokens — forest-green `--primary` (`oklch(0.518 0.128 148.5)` light / lighter in dark), gold `--gold` AI accent, soft off-white canvas, Poppins (display) + Inter (body) fonts, 20px base radius, `--shadow-soft`/`--shadow-lift`.
- **Dark mode**: full `.dark` token overrides (deep green-grey surfaces, adjusted primary/gold).
- **Utilities**: `glass-hero`, `glass-panel`, `card-soft`, `lift` (hover raise), `field-glow` (radial gradient wash), `ai-orb` (gold pulse ring), `equalizer` (speaking bars), `animate-float` (6s drift), `animate-fade-up` (staggered card entrance).
- **Motion safety**: `@media (prefers-reduced-motion: reduce)` disables the animation utilities.
- **Responsive**: desktop sidebar (lg+), mobile bottom nav + compact header, assistant floating bottom-right, max-w-6xl content, `truncate`/`min-w-0` overflow discipline throughout.
- **Components**: shadcn/ui primitives + app components (CropCard w/ SVG `ScoreRing`, Timeline, CropImage, QrCode, QrScannerDialog, FarmerAssistant, AddActivityDialog, AppLayout, HarvestIDLogo).
- **How animation stays functional**: motion is decorative-only (opacity/transform), keyed off state (fade-up on load, pulse while listening/speaking, float in hero), and never wraps interactive controls.

---

## 19. Logo / Branding

- **Official asset**: `public/logo/harvestID logo.jpeg` — 1254×1254 JPEG (~116 KB), committed as the single source of truth (Git commits `d18a62a` uploaded it; `81f1b17` made it the only logo and removed the earlier generated SVG).
- **Reusable component**: `src/components/HarvestIDLogo.tsx` — `<HarvestIDLogo variant="icon"|"full" size={n} decorative className imgClassName />`; renders the official JPEG with `alt="HarvestID logo"` (or `aria-hidden` when `decorative`); square sizing preserves exact proportions; no filters/rounding/effects on the artwork.
- **Usage**:
  - Desktop sidebar brand (40 px) + tagline;
  - Mobile header (34 px) / desktop header (32 px, xl+);
  - Passport header overlay (32 px) + footer mark (18 px);
  - Farm Assistant welcome card (22 px);
  - Crops empty state (64 px);
  - Favicon: `__root.tsx` head links the JPEG (`type="image/jpeg"`) with the legacy `favicon.ico` as fallback.
- **Why one source of truth**: every instance renders through the one component/one asset — no duplicated or derived logos, consistent proportions and transparency everywhere, and swapping the file updates all locations at once.

---

## 20. Security

| Area | Status (from repository) |
|---|---|
| Env vars | `backend/.env` exists locally but is **gitignored** (`.env`, `.env.*`); `.env.example` would be allowed but is not present. |
| API keys | `GOOGLE_API_KEY` read server-side only; `aiController` redacts keys/tokens from error details; frontend never receives it. |
| Supabase keys | `SUPABASE_URL`/`SUPABASE_ANON_KEY` server-side only; anon key is public by design but only usable against RLS-protected tables. |
| RLS | Enabled on both tables; policies are **permissive for `anon`** (`USING(true) WITH CHECK(true)`) — this is a public, non-authenticated app by design. |
| CORS | `cors()` default — allows all origins. |
| Input validation | Basic server-side: numeric id checks, activity kind whitelist, AI message length cap (4000), profile merge with defaults; no full schema validation library on the backend (zod exists on the frontend but is not used in the backend). |
| Error sanitization | JSON error middleware; `AiProviderError` with redacted detail; SSR 500s → static HTML error page (no stack leakage). |
| CSRF | `createCsrfMiddleware` in `src/start.ts` protects server functions from cross-site requests. |
| Client/server separation | Browser-only APIs (speech, geolocation, camera, localStorage, MediaRecorder) all guarded with `typeof window === "undefined"` / feature checks; SSR-safe. |
| Secrets never committed | `.env*`, `*.local`, `node_modules`, `.output` in `.gitignore`. |
| Auth | **None present** — no login system; single-farmer model with a default profile (Ramesh Kumar / Green Valley Farms). |

---

## 21. Error Handling + Production Fixes

Every entry below is backed by the repository / Git history / verified behavior.

### 21.1 Add Activity 413 (large payload)
**Problem** → Base64 photo/audio in activity payloads exceeded Express's default 100 kb JSON limit → 413 "Unable to add activity".
**Root cause** → Default body limit.
**Fix** → `app.use(express.json({ limit: "10mb" }))` + a JSON error middleware mapping 413 to a friendly message (`server.js`).
**Files** → `backend/server.js`.
**Verification** → Commit `41d1165 "Fix Add Activity 413: raise JSON body limit and return JSON errors"`.

### 21.2 Gemini model retirement / AI 404
**Problem** → `models/gemini-1.5-flash is not found` (model retired Sept 2025).
**Root cause** → Hardcoded retired model.
**Fix** → Ordered model fallback list (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`) with `GEMINI_MODEL` override; 404 → try next; `/api/chat/health` reports which models the key can actually use; errors return actionable JSON with redacted detail.
**Files** → `backend/controllers/aiController.js`, `backend/routes/ai.js`.
**Verification** → Commits `4c072dd` (self-diagnosing AI), production tests in EN + Kannada.

### 21.3 Production SSR crash ("This page didn't load")
**Problem** → Vercel production showed the 500 error page on every route.
**Root cause** → `FarmerAssistant` called `useSyncExternalStore(subscribeAutoSpeak, getAutoSpeak)` without the third `getServerSnapshot` argument; React 19 **throws during server rendering**, aborting the TanStack Start SSR render for the whole app (the assistant is mounted in the root shell).
**Fix** → Pass `getAutoSpeak` as `getServerSnapshot` (it is SSR-safe, returns `false` on the server) — one-line change in `src/components/FarmerAssistant.tsx`.
**Files** → `src/components/FarmerAssistant.tsx`.
**Verification** → `bun tsc -b --noEmit` clean; `bun run build` OK; production worker-bundle SSR render of `/` → HTTP 200 with real HTML (was 500). Commit `6db6046`.

### 21.4 h3-swallowed SSR errors
**Problem** → h3 converts thrown handler errors into opaque `{"unhandled":true,"message":"HTTPError"}` 500s, losing the stack.
**Fix** → `src/lib/error-capture.ts` wraps `console.error` to record + expand errors; `src/server.ts` detects the h3 body and re-renders the HTML error page with the recovered error logged.
**Files** → `src/lib/error-capture.ts`, `src/server.ts`, `src/lib/error-page.ts`, `src/start.ts`.

### 21.5 Supabase schema drift / missing columns
**Problem** → Inserts failed when `harvest` lacked new columns.
**Fix** → `createHarvest` retries with base columns only; controllers fall back to local JSON files when the table is missing; `updateHarvest` never reports success when nothing persisted.
**Files** → `backend/controllers/harvestController.js`, `activitiesController.js`, `backend/schema.sql`.
**Verification** → Commit `dd5c8e8 "Deploy production backend fixes"`, `ed3ecb1 "Fix profile persistence QR passport and crop images"`.

### 21.6 Profile persistence
**Problem** → Profile didn't persist across reloads.
**Fix** → JSON-file-backed profile controller with merge + defaults; frontend loads it at startup and prefills registration.
**Files** → `backend/controllers/profileController.js`, `src/lib/harvest-store.tsx`.

### 21.7 Crop image correctness
**Problem** → Broken/irrelevant images for unknown or legacy crops.
**Fix** → Centralized resolver with sentinel placeholder; only farmer `data:` uploads are persisted; broken URLs degrade to placeholder.
**Files** → `src/lib/crop-images.ts`, `src/components/CropImage.tsx`.

### 21.8 Multilingual SSR hydration safety
**Problem** → Saved language read from `localStorage` at first render could mismatch SSR HTML.
**Fix** → Language applied in `useEffect` after hydration; initial render always English.
**Files** → `src/i18n/index.tsx`.

### 21.9 Stale Render deployment
**Problem** → Render kept running old code after pushes.
**Fix** → Manual redeploy of backend commit `4c072dd` (documented in project history); verified live endpoints after deploy.
**Verification** → `GET /api/chat/health` → `configured:true` + models array.

---

## 22. Git + GitHub Workflow

Actual branch/commit history (`git log --oneline`, oldest → newest):

```
ed3ecb1 Fix profile persistence QR passport and crop images
dd5c8e8 Deploy production backend fixes
41d1165 Fix Add Activity 413: raise JSON body limit and return JSON errors
fd3b2df Finalize HarvestID production improvements
653ce8f Add multilingual farmer AI assistant and voice navigation
f5e1aee Fix farmer AI assistant and add dashboard language selector
4c072dd Make AI assistant 404 self-diagnosing: capture provider detail, try all models, report key-accessible models
146e5fb Upgrade HarvestID: crop/activity localization, time greeting, GPS, location-aware AI, AI voice output, premium animated UI
6db6046 Fix production SSR crash: pass getServerSnapshot to useSyncExternalStore in Farm Assistant
fb809bc Integrate official HarvestID branding and logo across UI
d18a62a Add files via upload
81f1b17 Use official HarvestID logo asset as single source of truth
```

Workflow: develop locally → typecheck/build → commit on `main` → push to GitHub (`origin/main`) → Vercel auto-deploys (frontend); backend changes are deployed to Render (manual redeploy after push, as documented for `4c072dd`). No feature branches or PRs are present in the visible history.

---

## 23. Vercel Deployment

- **Why**: SSR hosting for the TanStack Start frontend + static assets + GitHub auto-deploy.
- **Config**: **no `vercel.json` in the repository** → Vercel uses default settings. **Vercel project configuration is not verifiable from the repository.**
- **Build**: `npm install` (root) then `npm run build` → `vite build` → Nitro `.output/` (server bundle + `public/` statics; the repo's default Nitro target is the cloudflare-module preset per `vite.config.ts`/`wrangler.json`).
- **Env var**: `VITE_API_BASE_URL` (build-time, `import.meta.env.VITE_*`); if absent, production falls back to `https://harvest-id-backend.onrender.com`.
- **Auto-deploy**: on push to `main` (default Vercel behavior).
- **Frontend ↔ Render**: browser calls `https://harvest-id-backend.onrender.com/api/*` directly (CORS enabled).
- **SSR considerations**: `src/server.ts` + `start.ts` handle SSR errors; the known SSR crash (missing `getServerSnapshot`) was fixed in `6db6046` and verified by rendering the built worker's `fetch` in Node.
- **Known deployment errors fixed**: SSR 500 (above); static asset serving is handled by the host's asset layer (the local worker harness 404s statics because it exercises only the worker, not the host CDN — expected).

---

## 24. Render Deployment

- **Why**: cheap, simple Node hosting for the Express API.
- **Config**: **not verifiable from the repository** (Render project settings live in Render's dashboard). Backend package start script: `node server.js`.
- **Env vars**: `PORT` (Render injects), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`, optional `GEMINI_MODEL`.
- **Supabase connection**: via `backend/config/supabase.js`.
- **Auto/manual**: manual redeploy after backend pushes (documented history: `4c072dd` redeployed manually).
- **Backend URL**: `https://harvest-id-backend.onrender.com`; health: `GET /health` → `{success:true, message:"Backend is healthy"}`; AI health: `GET /api/chat/health`.
- **Render ↔ Vercel**: Vercel frontend → CORS-enabled Render API; Render → Supabase → PostgreSQL; Render → Google Gemini (server-side key).

---

## 25. Complete Production Architecture

```
                      FARMER (phone / desktop browser)
                              │
                              ▼
                   HarvestID Frontend (TanStack Start SSR)
                              Vercel
                              │
          ┌───────────────────┼──────────────────────┐
          ▼                   ▼                      ▼
   REST API (fetch)     Google Gemini        Browser APIs
   /api/* on Render     (via backend,       GPS · Speech
          │             server-side key)    Recognition · TTS
          ▼                                 Camera (QR) ·
   Express Backend  ───────────────►        MediaRecorder
   harvest-id-backend.onrender.com
          │
          ▼
   Supabase (PostgreSQL)
   harvest  ◄──1:N── activities
          │
          ▼
   JSON-file fallbacks (backend/data/*.json)
```

---

## 26. Complete User Workflow

1. Open HarvestID (Vercel URL) → SSR-rendered dashboard loads.
2. Select language from the header (persists across refresh/routes; syncs everywhere).
3. (Optional) Set up profile in Settings (name, farm, phone, email, location, preferences).
4. Dashboard shows greeting (time-aware), farm stats, recent activities, AI nudge, quick actions.
5. Register a crop (`/crops/new`): name, variety, category, area, photo (optional), GPS (optional, auto-filled location), dates → Save.
6. Land on crop details; see auto-resolved crop image, score, stage.
7. Add field activities (note / photo / voice), optionally AI-enhanced → timeline + score grow.
8. Ask the AI assistant (type or speak, any of 13 languages); hear the answer if auto-speak is on; say a nav command ("open crops") to move around.
9. Generate the digital passport (`/passport/$cropId`) → QR appears; share link or print PDF.
10. Buyers scan the QR (or open the link) → read-only passport with origin, GPS, timeline, AI summary, score.
11. Track documentation trends in Analytics; manage everything in Settings.

---

## 27. Data Flow Examples

### A. Register crop
User → `/crops/new` form → `addCrop()` → `POST /api/harvest` → `harvestController.createHarvest` → Supabase `harvest.insert` (fallback: base insert → JSON file) → 201 `{data:[crop]}` → store `setCrops` prepend → navigate to details, toast success.

### B. Add activity (AI-enhanced)
User → `AddActivityDialog` → note + "AI Enhance" (keyword classifier) → Save → `POST /api/activities` → `activitiesController.createActivity` (kind whitelist, insert, crop score +2) → 201 → store prepends activity + bumps score → `Timeline` re-renders, toast "Activity recorded".

### C. Ask AI assistant
User types/speaks "How should I take care of my tomato crop?" → `FarmerAssistant.send` → `POST https://harvest-id-backend.onrender.com/api/chat` `{message, lang, context}` → `aiController.chat` → Gemini `generateContent` (model fallback) → `{success, reply}` → rendered as bubble; auto-speak TTS in `speechTag`; errors surface the real backend message.

### D. Scan QR passport
Buyer taps "Scan QR" (or camera) → `QrScannerDialog` → `html5-qrcode` decodes passport URL → `parseCropIdFromQr` → navigate `/passport/42` → store already has crops/activities → read-only passport renders (identity, QR, score, AI summary, timeline).

### E. Change language
Farmer picks ಕನ್ನಡ in the header → `setLang("kn")` → provider state updates → all `t()` calls re-render; `localStorage` + `document.documentElement.lang` update; assistant voice input/output now use `kn-IN`; crop names localize at render time; DB untouched.

### F. GPS crop registration
User taps "Use my location" → `getCurrentPosition` → `"12.971598, 77.594563"` into `gps` → BigDataCloud reverse geocode → `location` filled → saved with crop → passport shows GPS; AI context includes it.

### G. Voice question → AI → voice answer
Mic → recognition (`lang=kn-IN`) → transcript not a nav command → fills input → send → Gemini replies in Kannada → bubble + auto-speak TTS (Kannada voice if installed).

---

## 28. Local Development Setup

### Prerequisites
- Node.js (version **not pinned/verifiable** in the repo — `.nvmrc`/`engines` absent).
- npm (lockfiles present). Bun can also run the frontend scripts (`bun tsc -b --noEmit`, `bun run build` were used in this project's verification).
- A Supabase project, a Google Gemini API key, and a Render account (for full-stack/prod parity).

### Install
```bash
npm run install:all        # root: npm install && npm --prefix backend install
# or manually:
npm install && npm --prefix backend install
```

### Environment (backend — `backend/.env`, gitignored)
```
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
GOOGLE_API_KEY=…
# optional: GEMINI_MODEL=gemini-2.5-flash,gemini-3.5-flash-lite
# optional: PORT=5000, MONGODB_URI (legacy, unused)
```
Frontend (optional): `.env.local` with `VITE_API_BASE_URL=…` — otherwise dev uses `http://127.0.0.1:5000`, production uses the Render URL.

### Commands (from `package.json` / `backend/package.json`)
| Purpose | Command |
|---|---|
| Frontend dev server | `npm run dev` (`vite dev`) |
| Full-stack dev (backend + frontend) | `npm run dev:full` |
| Backend only | `cd backend && npm start` (`node server.js`) |
| Typecheck | `npx tsc -b --noEmit` |
| Production build | `npm run build` (`vite build`) |
| Build (dev mode) | `npm run build:dev` |
| Preview built app | `npm run preview` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Backend syntax check | `node --check backend/server.js` (+ each controller/route) |
| Backend "tests" | `npm test` (stub: "Error: no test specified") |

### Supabase setup
1. Create project; grab `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
2. Run `backend/schema.sql` once in the SQL editor (idempotent).

### Gemini setup
1. Get a `GOOGLE_API_KEY` from Google AI Studio.
2. Set it on the backend (`backend/.env` locally, Render env in prod).
3. Verify with `GET /api/chat/health` → `configured:true` + models list.

### Dev flow
- Frontend dev: `npm run dev` (Vite proxies `/api` → `localhost:5000`).
- Backend dev: `cd backend && npm start`.
- Full-stack: `npm run dev:full`.

---

## 29. Environment Variables

| Variable | Used by | Purpose | Required | Secret? |
|---|---|---|---|---|
| `SUPABASE_URL` | Backend (`config/supabase.js`) | Supabase project URL | Yes (prod) | No |
| `SUPABASE_ANON_KEY` | Backend (`config/supabase.js`) | Supabase anon client key | Yes (prod) | Yes* |
| `GOOGLE_API_KEY` | Backend (`aiController.js`) | Gemini API key (server-side only) | Yes (for AI) | **Yes** |
| `GEMINI_MODEL` | Backend (`aiController.js`) | Optional comma-separated model override | No | No |
| `PORT` | Backend (`server.js`) | HTTP port (Render injects) | Prod only | No |
| `VITE_API_BASE_URL` | Frontend (`harvest-store.tsx`) | Overrides backend base URL | No (falls back) | No |
| `MONGODB_URI` | Backend `config/db.js` | **Legacy/unused** | No | Yes* |

\* Anon key is publicly readable by design (used client-side by Supabase normally); treat as secret anyway. Never commit any of these.

Where to configure:
- **Local**: backend → `backend/.env`; frontend → `.env.local` (both gitignored).
- **Vercel**: `VITE_API_BASE_URL` (build-time) — frontend only.
- **Render**: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`, optional `GEMINI_MODEL` — backend only.

---

## 30. Testing + Verification

No automated test suites exist (root has no `test` script; backend `npm test` is a stub). The project's verification methods (all actually used and passing):

| Test | Result (last run) | Purpose |
|---|---|---|
| `npx tsc -b --noEmit` | ✅ clean | TypeScript strict typecheck |
| `vite build` (`npm run build`) | ✅ succeeds | Production build + Nitro output |
| `node --check` on backend files | ✅ (per history) | Backend syntax validation |
| Worker-bundle SSR render of `/` | ✅ HTTP 200, real HTML (after 6db6046) | Proves main route renders in production SSR config |
| Worker-bundle SSR render of `/passport/1` | ✅ HTTP 200 (not-found view for unknown crop) | Passport route SSR |
| `GET /health` (Render) | ✅ `{success:true}` | Backend liveness |
| `GET /api/chat/health` (Render) | ✅ `configured:true` + models array | AI config + key/model availability |
| `POST /api/chat` (EN + Kannada) | ✅ real Gemini replies | AI end-to-end, language passthrough |
| Asset shipping check | ✅ `.output/public/logo/harvestID logo.jpeg` | Logo in production build |

---

## 31. Performance + Scalability

**Already scalable / optimized**
- Crop image catalog is data-driven (one line per crop) — no UI changes to add crops.
- Centralized stores avoid duplicate fetching; API normalization keeps payloads lean (no raw DB rows).
- Index on `activities(crop_id)`.
- CSS-only animations (GPU-friendly transforms); `lazy` images; dynamic import for `html5-qrcode` (keeps the main bundle small).
- AI model fallback + env-override protects against provider churn; `/health` diagnostics.
- i18n is a single flat key map — cheap lookups, no runtime pluralization engine needed.
- SSR-first rendering for fast first paint.

**Potential future improvements (not currently implemented)**
- Real authentication + per-farmer RLS (currently single-farmer, open anon policies).
- Move media out of base64 TEXT columns into Supabase Storage / object storage with signed URLs (DB bloat + payload limits).
- Move profile from JSON file into a DB table (Render's disk is ephemeral).
- Add automated tests (unit for resolvers/controllers, e2e for flows).
- Add rate limiting per IP on the API, and caching for catalog image URLs.
- Pagination for crops/activities.
- Background jobs for AI enrichment / passport generation.

---

## 32. Limitations

- **Browser voice compatibility**: Web Speech recognition/TTS is browser-dependent (Chrome/Chromium best); unsupported browsers fall back to text (localized messages).
- **GPS permission**: denied/timeout gracefully degrades; GPS is optional.
- **AI dependency**: requires a valid `GOOGLE_API_KEY`, network, and currently available models; subject to rate limits (429 handled) and latency (45s timeout).
- **Internet requirement**: the app is fully online (frontend/backend/DB/AI); no offline mode.
- **Unknown crops**: show an honest "Crop image unavailable" placeholder (no photo).
- **Single-user model**: no accounts; profile is one farmer; all data shared via permissive RLS.
- **Profile storage**: JSON file on the Render server — can be lost on redeploys (fallback default profile).
- **Media size caps**: crop photo ≤8 MB, activity photo ≤5 MB (base64 in TEXT columns).
- **No automated tests** in the repository.
- **Vercel/Render project configuration** not present in the repo (managed in their dashboards).

---

## 33. Future Roadmap

**Short term**
- Multi-farmer accounts with auth and per-farmer RLS.
- Move images/audio to Supabase Storage; migrate profile to a `profiles` table.
- Add automated tests (resolver/controller unit tests + Playwright e2e).

**Medium term**
- Activity AI enrichment via Gemini (photos → descriptions, pest detection).
- Offline-first PWA with sync; crop advisories based on location/season.
- Hindi-first and voice-first onboarding for low-literacy users.

**Long term**
- Marketplace: buyer verification dashboards, lot/batch tracing, farm certification.
- Weather/soil/market-price integrations (with disclaimers per current AI guardrails).
- Multi-tenant B2B/B2G deployments (FPOs, cooperatives, government schemes).

---

## 34. File-to-Feature Mapping

| Feature | Frontend files | Backend files | Database | External service |
|---|---|---|---|---|
| Dashboard | `routes/index.tsx`, `AppLayout.tsx`, `CropCard.tsx`, `QrScannerDialog.tsx` | `GET /api/harvest`, `GET /api/activities`, `GET /api/profile` | harvest, activities | — |
| Crop registration/CRUD | `routes/crops.new.tsx`, `crops.index.tsx`, `harvest-store.tsx` | `harvestController.js`, `routes/harvest.js` | harvest | BigDataCloud reverse geocode, browser geolocation |
| Crop details | `routes/crops.$cropId.tsx`, `Timeline.tsx`, `CropImage.tsx` | (store data) | harvest, activities | Unsplash/Wikimedia images |
| Activities | `AddActivityDialog.tsx`, `routes/activities.tsx`, `Timeline.tsx` | `activitiesController.js` | activities | MediaRecorder, camera |
| Analytics | `routes/analytics.tsx` | (store data) | harvest, activities | — |
| Passport + QR | `routes/passport.$cropId.tsx`, `passports.tsx`, `QrCode.tsx`, `QrScannerDialog.tsx`, `crop-images.ts` | `PUT /api/harvest/:id` | harvest | react-qr-code, html5-qrcode |
| AI assistant | `FarmerAssistant.tsx`, `speech.ts`, `auto-speak.ts` | `aiController.js`, `routes/ai.js` | (context from harvest) | Google Gemini |
| i18n | `i18n/*`, `crop-l10n.ts`, all components | — | — | — |
| Voice | `FarmerAssistant.tsx`, `speech.ts`, `AddActivityDialog.tsx` | — | activities (audio) | Web Speech API |
| GPS | `routes/crops.new.tsx` | (stores `gps`) | harvest.gps | browser geolocation, BigDataCloud |
| Profile/Settings | `routes/settings.tsx`, `harvest-store.tsx` | `profileController.js` | — (JSON file) | — |
| Branding | `HarvestIDLogo.tsx`, `AppLayout.tsx`, `passport.$cropId.tsx`, `FarmerAssistant.tsx`, `crops.index.tsx`, `__root.tsx` | — | — | `public/logo/harvestID logo.jpeg` |
| SSR safety | `server.ts`, `start.ts`, `error-page.ts`, `error-capture.ts` | — | — | — |

---

## 35. Complete Request/Response Flows

### POST /api/activities
```
Frontend AddActivityDialog
  → addActivity() in harvest-store
    → fetch POST https://harvest-id-backend.onrender.com/api/activities
      → Express json(10mb) → routes/activities.js
        → activitiesController.createActivity
          → supabase.from("activities").insert(payload).select("*")
            → (fallback) data/activities.json
          → supabase harvest score update (+2)
        → 201 {success, data}
      → apiRequest parses; throws on error
    → store setActivities prepend + crop score bump
  → Timeline re-render + toast
```

### POST /api/chat
```
FarmerAssistant send()
  → fetch POST .../api/chat {message, lang, context}
    → routes/ai.js → aiController.chat
      → normalizeLang; buildSystemPrompt(lang, context)
      → chatWithGemini(apiKey, prompt)
        → for model in [gemini-2.5-flash, …]:
            fetch generateContent?key=… (45s abort)
            404 → next model; else map error
      → {success, reply}
  → bubble render; autoSpeak → speechSynthesis
```

### GET /api/harvest (store bootstrap)
```
HarvestProvider mount → refreshData()
  → Promise.all(GET /api/harvest, GET /api/activities)
    → controllers → supabase select * order created_at desc
    → normalize → {success, data:[…]}
  → setCrops / setActivities / loading=false
```

### PUT /api/profile
```
Settings submit → saveProfile(form)
  → PUT /api/profile → profileController.updateProfile
    → read data/profile.json (or defaults) → merge → write
    → {success, data: profile}
  → store setProfile; toasts
```

---

## 36. "How HarvestID Was Built" — Simple Explanation

- **What we built**: a web app that gives every crop a digital identity — like an Aadhaar/passport for produce. Farmers log crops and field activities; the app builds a QR-verifiable passport buyers can scan.
- **How we built it**: React (TanStack Start) frontend with server-side rendering, an Express API, a Supabase PostgreSQL database, and Google Gemini AI. Everything is multilingual (13 Indian languages + English) and supports voice.
- **How the frontend works**: file-based routes (`/crops`, `/passport/42`, …) inside a shared shell (sidebar/header/mobile nav). One global store holds crops/activities/profile; one i18n provider holds the language; the whole UI re-renders when the language changes.
- **How the backend works**: Express endpoints (`/api/harvest`, `/api/activities`, `/api/profile`, `/api/chat`) normalize data between the database and the frontend, and fall back to local JSON files if Supabase is unavailable.
- **How the database works**: two tables — `harvest` (crops) and `activities` (field records, linked by crop_id with cascade delete), with a traceability score and media stored as text.
- **How AI works**: the assistant posts the farmer's question + language + context to a backend route that calls Google Gemini; the model fallback list keeps it working as Google retires models; the API key stays on the server.
- **How multilingual/voice works**: 14 translation catalogs behind one context; Web Speech API for mic input/TTS; voice commands navigate the app in the farmer's language.
- **How QR passport works**: react-qr-code encodes the passport URL; html5-qrcode scans it; the read-only passport page shows origin, timeline, score, and an AI summary.
- **How deployment works**: GitHub → Vercel (frontend, auto-deploy) + Render (backend) + Supabase (DB) + Google Gemini (AI). Production is verified with typecheck, build, SSR render, and live API health/chat checks.

---

## 37. Project Presentation Version

- **Title**: HarvestID — Digital Crop Passports
- **One-line pitch**: Every harvest gets a verifiable digital identity — record it once, prove it with one scan.
- **Problem**: Buyers can't verify crop origin or care; farmers lack simple, language-inclusive record-keeping that converts into trust.
- **Solution**: A multilingual, voice-first farm records app that auto-builds QR-verified digital crop passports with AI summaries.
- **Key features**: crop registration + GPS, activity timeline (notes/photos/voice), traceability scoring, QR passport generation & scanning, analytics, farmer AI assistant, 13 languages, voice input/output/navigation, official branding.
- **Tech stack**: React 19 + TanStack Start (SSR) + Tailwind 4 + shadcn/ui; Express (Node) API; Supabase (PostgreSQL); Google Gemini; Vercel + Render.
- **Architecture**: Vercel frontend → Render REST API → Supabase DB; Gemini server-side; browser APIs (GPS, speech, camera).
- **Innovation**: canonical crop-name keys that localize display without breaking image resolution; AI model fallback for provider churn; SSR-safe browser-API usage.
- **AI capabilities**: language-aware advice with farmer/crop/GPS context, safe error handling, self-diagnosing health endpoint.
- **Multilingual**: 13 Indian languages + English, persisted, three shared selectors, localized crop names.
- **Deployment**: GitHub → Vercel (auto) + Render (manual redeploy) + Supabase.
- **Impact**: trust between farmers and buyers; accessible agri-tech for regional-language smallholders.
- **Future scope**: multi-farmer auth, storage-backed media, offline PWA, buyer dashboards, weather/soil integrations.

---

## 38. Final Architecture Summary

- **A. Tech stack**: React 19 / TanStack Start / Router / React Query, Tailwind 4, shadcn/ui, lucide, Recharts, sonner, react-qr-code, html5-qrcode, Express, Supabase JS, Gemini REST, Vite/Nitro, npm.
- **B. Architecture**: SSR frontend (Vercel) → REST API (Render) → Postgres (Supabase), Gemini via backend, browser APIs client-side.
- **C. Database**: `harvest` + `activities` (1:N, cascade), score, media-as-text, RLS permissive anon, index on crop_id.
- **D. APIs**: 16 endpoints, `{success, data|error}` envelope, camelCase normalization, JSON-file fallbacks.
- **E. AI**: `/api/chat` → Gemini with language+context, model fallback list, 45s timeout, redacted errors, `/api/chat/health`.
- **F. Voice**: SpeechRecognition (input + nav), speechSynthesis (output), MediaRecorder (notes), per-language speech tags, auto-speak.
- **G. GPS**: one-shot geolocation + BigDataCloud reverse geocode, stored per crop, fed to AI.
- **H. QR**: react-qr-code (URL-encoded passport), html5-qrcode (camera scan), public read-only passport page.
- **I. Multilingual**: 14 catalogs, one context, localStorage, three selectors, render-time crop-name localization, `document.lang` sync.
- **J. Frontend**: route-based pages, global stores, responsive shell, dark mode, CSS motion, official logo component.
- **K. Backend**: Express + controllers + Supabase client + JSON-file fallbacks + JSON error middleware.
- **L. Deployment**: GitHub `main` → Vercel (auto) + Render (manual), Supabase cloud, verified SSR + health endpoints.
- **M. Security**: server-side keys, redacted AI errors, gitignored env, CSRF for server fns; caveats — no auth, open CORS/RLS.
- **N. Testing**: typecheck, production build, SSR render harness, live health/chat verification; no automated suites yet.

---

## 39. One-Page Project Workflow

```
IDEA
 → REQUIREMENTS (crops → activities → passport → QR → AI → multilingual → voice → GPS)
 → UI/UX (forest-green/gold design, mobile-first, animations, official logo)
 → FRONTEND (TanStack Start SSR, file routes, global store + i18n, voice/QR/GPS)
 → BACKEND (Express, routes/controllers, Supabase client, JSON fallbacks)
 → DATABASE (Supabase: harvest 1—N activities, schema.sql + RLS)
 → APIs (16 REST endpoints, {success,data|error})
 → AI (Gemini /api/chat, model fallback, language + context, /health)
 → MULTILINGUAL (14 catalogs, one state, render-time crop names)
 → VOICE (recognition + TTS + nav commands + voice notes)
 → GPS (one-shot capture + reverse geocode → passport/AI)
 → QR PASSPORT (generate URL QR, scan, read-only public page)
 → TESTING (tsc, build, SSR render, health + chat checks)
 → GITHUB (feature commits on main, pushed to origin/main)
 → VERCEL + RENDER (frontend auto-deploy; backend node server.js; Supabase DB)
 → PRODUCTION (live site, verified endpoints, auto-deploy on push)
 → MONITORING (health endpoints, error boundaries, SSR error wrapper, Lovable telemetry hooks)
```

---

*End of document. Compiled from the actual repository state at commit `81f1b17` (main).*
