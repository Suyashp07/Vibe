# 🎉 Vibe by Swaniki

> **India's first AI-powered event creation and discovery platform.** Create, discover, and RSVP to events in seconds — competing head-to-head with Luma and Partiful.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Suyashp07/Vibe)
![Node](https://img.shields.io/badge/Node.js-24.x-green)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![Gemini](https://img.shields.io/badge/AI-Gemini_3.5-blue)

**Live:** [vibe-seven-pied.vercel.app](https://vibe-seven-pied.vercel.app)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Bot Integrations](#bot-integrations)
  - [Telegram Bot](#telegram-bot)
  - [WhatsApp Bridge](#whatsapp-bridge)
- [Key Features & Flows](#key-features--flows)
- [Deployment](#deployment)
  - [Vercel (Web App)](#vercel-web-app)
  - [Render (WhatsApp Bridge)](#render-whatsapp-bridge)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENTS                              │
│  Browser (Next.js SSR)  │  Telegram Bot  │  WhatsApp Bot  │
└────────────┬────────────┴───────┬────────┴───────┬────────┘
             │                    │                │
             ▼                    ▼                ▼
┌──────────────────────────────────────────────────────────┐
│                   NEXT.JS APP ROUTER                      │
│  /api/events/*  │  /api/rsvps/*  │  /api/communication/*  │
│  /api/ai/*      │  /api/admin/*  │  /api/telegram/webhook  │
│                                  │  /api/whatsapp/webhook  │
└────────────┬─────────────────────┴───────────────────────┘
             │                                │
     ┌───────▼───────┐              ┌─────────▼─────────┐
     │   SUPABASE    │              │  WHATSAPP BRIDGE   │
     │  PostgreSQL   │              │  (Render/Baileys)  │
     │  Auth + RLS   │              │  Port 3002         │
     │  Storage      │              └───────────────────┘
     └───────┬───────┘
             │
     ┌───────▼───────┐
     │  GOOGLE AI    │
     │  Gemini 3.5   │
     │  Vision + NLP │
     └───────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14.2 (App Router) | SSR, API routes, middleware |
| **Language** | TypeScript 5.6 | Type safety across frontend + backend |
| **Database** | Supabase (PostgreSQL) | Events, RSVPs, profiles, messages, auth |
| **AI Engine** | Google Gemini 3.5 Flash | Event extraction from images/URLs, NLP |
| **Styling** | Tailwind CSS 3.4 | Utility-first responsive design |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Email** | Nodemailer (Gmail SMTP) | RSVP confirmations, host notifications |
| **Telegram** | Bot API (webhooks) | Event ingestion via chat |
| **WhatsApp** | Baileys (WhatsApp Web) | Event creation + host messaging bridge |
| **Deployment** | Vercel (web) + Render (bridge) | Edge functions + persistent processes |
| **Package Manager** | pnpm | Fast, disk-efficient installs |

---

## Getting Started

### Prerequisites

- **Node.js 24.x** (required by Vercel deployment)
- **pnpm** (recommended) or npm
- **Supabase account** — [supabase.com](https://supabase.com)
- **Google AI API key** — [aistudio.google.com](https://aistudio.google.com)
- **Telegram Bot Token** (optional) — via [@BotFather](https://t.me/BotFather)

### Installation

```bash
# Clone the repository
git clone https://github.com/Suyashp07/Vibe.git
cd Vibe

# Install dependencies
pnpm install
# or
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── SUPABASE (Required) ───────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# ─── GOOGLE AI (Required for AI features) ──────────────
GEMINI_API_KEY=AIza...your-gemini-api-key

# ─── EMAIL (Required for notifications) ────────────────
# Gmail App Password: Google Account > Security > 2FA > App Passwords
RESEND_API_KEY=your-gmail-app-password
EMAIL_FROM=your-gmail@gmail.com

# ─── APP CONFIG ────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── TELEGRAM BOT (Optional) ──────────────────────────
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_HOST_CHAT_ID=-100xxxxxxxxxx
TELEGRAM_ADMIN_CHAT_ID=-100xxxxxxxxxx
TELEGRAM_WEBHOOK_SECRET=your-random-secret

# ─── WHATSAPP BRIDGE (Optional) ───────────────────────
WHATSAPP_BRIDGE_URL=http://localhost:3002
WHATSAPP_BRIDGE_SECRET=your-random-secret
WHATSAPP_HOST_PHONE=91xxxxxxxxxx
WHATSAPP_WEBHOOK_SECRET=your-random-secret
```

> **⚠️ Important:** `RESEND_API_KEY` is actually a Gmail App Password — not a Resend.com key. The variable name is legacy. Generate it via: Google Account → Security → 2-Step Verification → App Passwords.

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** in your Supabase dashboard
3. Run the schema files in order:

```bash
# Core tables (events, profiles, rsvps)
supabase/schema.sql

# Admin tables (curators, audit_logs)
supabase/admin_schema.sql

# Communication tables (conversations, messages)
supabase/communication_schema.sql
```

4. Copy your project URL and keys into `.env.local`

### Running Locally

```bash
# Start the development server
pnpm dev
# or
npm run dev

# Open in browser
open http://localhost:3000
```

**Optional — WhatsApp Bridge (separate terminal):**
```bash
# Build the bridge
pnpm build:whatsapp

# Start the bridge (scans QR code on first run)
pnpm whatsapp:bridge
```

---

## Project Structure

```
vibe-by-swaniki/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Homepage / Discover feed
│   │   ├── [slug]/                   # Dynamic event pages
│   │   │   └── page.tsx              # Individual event view + RSVP form
│   │   ├── vibes/                    # Vibe Instant — TikTok-style reels
│   │   │   └── page.tsx              # Vertical swipe event feed
│   │   ├── admin/                    # Admin panel
│   │   │   ├── page.tsx              # Dashboard with event queue
│   │   │   ├── events/               # Event management
│   │   │   ├── rsvps/                # RSVP management
│   │   │   ├── users/                # User management
│   │   │   └── audit-logs/           # Admin action logs
│   │   ├── dashboard/                # Organizer dashboard
│   │   ├── create/                   # Manual event creation
│   │   │   ├── ai/                   # AI-assisted creation
│   │   │   └── manual/               # Form-based creation
│   │   ├── login/                    # Email OTP login
│   │   ├── signup/                   # Registration with validation
│   │   ├── guest/                    # Guest portal
│   │   ├── passes/                   # Digital event passes with QR
│   │   ├── discover/                 # Event discovery
│   │   ├── onboarding/               # New user onboarding
│   │   │
│   │   └── api/                      # API Routes (see API Reference)
│   │       ├── admin/                # Admin CRUD operations
│   │       ├── ai/                   # Gemini AI extraction
│   │       ├── auth/                 # Email validation
│   │       ├── communication/        # Host-guest messaging
│   │       ├── events/               # Event CRUD + AI create
│   │       ├── rsvps/                # RSVP lifecycle
│   │       ├── telegram/             # Telegram bot webhook
│   │       └── whatsapp/             # WhatsApp bot webhook
│   │
│   ├── components/
│   │   ├── ui/                       # Shared UI components
│   │   │   ├── EventCard.tsx         # Event card for discover grid
│   │   │   ├── RSVPForm.tsx          # RSVP submission form
│   │   │   └── Navbar.tsx            # Top navigation
│   │   ├── vibes/                    # Vibe Instant components
│   │   │   ├── VibeReelCard.tsx      # Full-screen event reel card
│   │   │   ├── QuickJoinModal.tsx    # Quick RSVP modal
│   │   │   └── CreateVibeModal.tsx   # Create new vibe modal
│   │   └── communication/           # Messaging components
│   │       ├── ConnectHostModal.tsx   # Chat entry point
│   │       └── EventConversationModal.tsx  # Active messaging UI
│   │
│   ├── lib/                          # Core business logic
│   │   ├── store.ts                  # Client-side state (localStorage + Supabase sync)
│   │   ├── auth.ts                   # Auth helpers, email validation
│   │   ├── location.ts              # Haversine distance, city detection, geocoding
│   │   ├── email.ts                  # Nodemailer Gmail SMTP
│   │   ├── eventSurety.ts           # AI surety scoring for auto-approval
│   │   ├── ai/
│   │   │   └── eventExtractor.ts    # Gemini Vision + NLP event extraction
│   │   └── communication/
│   │       ├── conversationService.ts  # Conversation lifecycle manager
│   │       ├── auth.ts               # Communication session verification
│   │       ├── types.ts              # Shared communication types
│   │       └── adapters/
│   │           ├── whatsappAdapter.ts  # WhatsApp channel adapter
│   │           └── telegramAdapter.ts  # Telegram channel adapter
│   │
│   ├── middleware.ts                 # Edge middleware (admin auth)
│   └── types/                        # TypeScript type definitions
│       └── index.ts                  # EventItem, RSVPItem, etc.
│
├── scripts/
│   └── whatsapp-bridge.ts           # Standalone WhatsApp Web bridge (Baileys)
│
├── supabase/
│   ├── schema.sql                    # Core DB schema
│   ├── admin_schema.sql              # Admin tables
│   ├── communication_schema.sql      # Messaging tables
│   └── email-templates/              # Email HTML templates
│
├── public/                           # Static assets
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── tsconfig.scripts.json             # Backend scripts TS config
├── tailwind.config.ts                # Tailwind configuration
├── CHANGELOG.md                      # Version history
└── .env.local                        # Environment variables (not committed)
```

---

## API Reference

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events/list` | List all published events (filterable) |
| `GET` | `/api/events/by-slug?slug=...` | Get single event by slug |
| `POST` | `/api/events/ai-create` | AI-powered event creation from image/URL |
| `POST` | `/api/events/like` | Like/unlike an event |
| `DELETE` | `/api/events/delete` | Delete event (owner only) |

### RSVPs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rsvps/create` | Create new RSVP |
| `GET` | `/api/rsvps/list?eventId=...` | List RSVPs for an event |
| `POST` | `/api/rsvps/update-status` | Accept/reject RSVP (host) |

### Communication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/communication/conversations` | Find or create conversation (RSVP-gated) |
| `GET` | `/api/communication/conversations?userId=...` | List user's conversations |
| `POST` | `/api/communication/conversations/[id]/messages` | Send message in conversation |
| `GET` | `/api/communication/conversations/[id]/messages` | Get conversation messages |
| `POST` | `/api/communication/messages` | Direct message (legacy) |
| `POST` | `/api/communication/announcements` | Broadcast to all RSVPs |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/extract` | Extract event data from URL/image |
| `POST` | `/api/ai/generate` | Generate event content (description, FAQ) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/PATCH` | `/api/admin/events` | Admin event queue (approve/reject) |
| `POST` | `/api/admin/events/from-url` | Import event from URL |
| `GET` | `/api/admin/rsvps` | View all RSVPs |
| `GET/POST` | `/api/admin/users` | User management |
| `GET/POST` | `/api/admin/curators` | Curator management |
| `GET` | `/api/admin/audit-logs` | Admin action audit trail |

### Bots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/telegram/webhook` | Telegram bot webhook handler |
| `POST` | `/api/whatsapp/webhook` | WhatsApp bridge webhook handler |
| `GET` | `/api/whatsapp/bridge-info` | Bridge connection status |

---

## Bot Integrations

### Telegram Bot

The Telegram bot ingests event flyers and URLs to auto-create events.

**Setup:**
1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Create a Telegram Group/Supergroup and get its Chat ID
3. Set the webhook:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook", "secret_token": "your-secret"}'
```

**How it works:**
- Send an event poster image → Gemini Vision extracts event details
- Send a ticketing URL → AI scrapes and parses the listing
- Bot responds with an interactive confirmation card
- Host taps ✅ to publish the event live on Vibe

### WhatsApp Bridge

A standalone Baileys-based WhatsApp Web bridge for event creation and host-guest messaging.

**Setup:**
1. Deploy the bridge to Render (see [Deployment](#render-whatsapp-bridge))
2. On first run, scan the QR code displayed in logs
3. Set `WHATSAPP_BRIDGE_URL` in your `.env.local`

**How it works:**
- Guest sends a message via Vibe UI → forwarded to host's WhatsApp
- Host replies on WhatsApp → response delivered to guest in Vibe
- Users can also send event flyers to the WhatsApp number to create events

---

## Key Features & Flows

### 🎯 Event Lifecycle

```
Create (AI/Manual/Bot) → Draft → Admin Approval → Live → Past
```

- Events created with **≥90% AI surety** are auto-approved
- Events with missing aspects are flagged for admin review
- External events (BookMyShow, Insider, etc.) redirect to the platform

### 🔒 RSVP-Gated Messaging (Vibe Instant)

Guests must RSVP before messaging the host to prevent spam:

```
See Event → Tap "I'm In ⚡" → Submit RSVP → "Ask Host 💬" unlocked
```

- Frontend gate: `VibeReelCard` checks `hasUserRSVP()` from localStorage
- Backend gate: `/api/communication/conversations` verifies RSVP in Supabase
- Host receives messages tagged with `✅ RSVP'd (Name)` badge

### 📍 Location-Based Discovery

- GPS-based city detection via OpenStreetMap Nominatim
- Haversine distance calculations for proximity ranking
- Indian city coordinate database in `src/lib/location.ts`

### 🤖 AI Event Extraction

Supports multiple extraction strategies:
1. **Vision OCR** — Gemini analyzes event poster images
2. **JSON-LD Parsing** — Extracts schema.org structured data from URLs
3. **HTML Scraping** — Falls back to meta tags and page content
4. **AI NLP** — Gemini generates missing fields (tagline, FAQ, categories)

---

## Deployment

### Vercel (Web App)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Required Vercel Settings:**
- **Framework Preset:** Next.js
- **Node.js Version:** 24.x (set in `package.json` engines)
- **Build Command:** `next build`
- **All `.env.local` variables** must be added in Vercel Environment Variables

### Render (WhatsApp Bridge)

The WhatsApp bridge runs as a persistent Node.js service on Render.

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Configure:
   - **Build Command:** `pnpm install && pnpm build:whatsapp`
   - **Start Command:** `pnpm whatsapp:bridge`
   - **Environment:** Node 20+
4. Add environment variables:
   - `WHATSAPP_BRIDGE_SECRET`
   - `WHATSAPP_WEBHOOK_SECRET`
   - `VIBE_WEBHOOK_URL` (your Vercel URL + `/api/whatsapp/webhook`)
   - `PORT` (Render assigns this automatically)

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase Auth) |
| `events` | All event data (title, venue, dates, AI metadata) |
| `rsvps` | Guest registrations with status tracking |

### Admin Tables

| Table | Purpose |
|-------|---------|
| `telegram_curators` | Authorized Telegram bot users |
| `admin_audit_logs` | Admin action trail (approve, reject, delete) |

### Communication Tables

| Table | Purpose |
|-------|---------|
| `event_conversations` | Host-guest conversation threads |
| `event_conversation_messages` | Individual messages within conversations |
| `event_messages` | Legacy direct messages |

**Full schema files:** [`supabase/`](./supabase/)

---

## Contributing

### Branch Naming

```
feat/short-description    # New features
fix/short-description     # Bug fixes
refactor/short-description # Code cleanup
docs/short-description     # Documentation
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): description     # New feature
fix(scope): description      # Bug fix
refactor(scope): description # Code restructure
docs: description            # Documentation only
```

**Scopes:** `ui`, `admin`, `ai`, `telegram`, `whatsapp`, `auth`, `rsvp-gate`, `deploy`, `communication`

### Development Workflow

1. **Pull latest:** `git pull origin main`
2. **Create branch:** `git checkout -b feat/your-feature`
3. **Make changes** and test locally with `pnpm dev`
4. **Verify build:** `pnpm build` (must pass with zero errors)
5. **Commit & push:** Follow commit convention above
6. **Create PR** against `main`

### Key Conventions

- **All API routes** use `export const dynamic = 'force-dynamic'` for server-side execution
- **Supabase client** is created per-request in API routes using service role key
- **Client state** is managed in `src/lib/store.ts` via localStorage + Supabase sync
- **Events are never deleted** from the public site — they transition to `draft`/`cancelled`
- **External events** (source_type: 'external') cannot receive RSVPs on Vibe

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Vercel build fails with "Node.js deprecated" | Ensure `package.json` has `"engines": { "node": "24.x" }` |
| Vercel build fails with `ERR_PNPM_OUTDATED_LOCKFILE` | Run `pnpm install --no-frozen-lockfile` and commit `pnpm-lock.yaml` |
| Events not showing on site | Check event `status` is `'live'` (not `'draft'`) in Supabase |
| AI extraction returns empty | Verify `GEMINI_API_KEY` is set and valid |
| Email notifications not sending | Ensure Gmail App Password (not account password) is in `RESEND_API_KEY` |
| WhatsApp bridge disconnects | Scan QR again — sessions expire after ~20 days of inactivity |
| RSVP gate blocks after RSVP | Clear localStorage or check Supabase `rsvps` table for matching email |
| Telegram webhook not responding | Verify webhook URL is set and `TELEGRAM_WEBHOOK_SECRET` matches |

### Useful Debug Commands

```bash
# Check Supabase connection
curl "https://your-project.supabase.co/rest/v1/events?select=id,title&limit=1" \
  -H "apikey: your-anon-key"

# Check Telegram webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Check WhatsApp bridge health
curl "https://your-domain.com/api/whatsapp/bridge-info"

# Build locally to catch errors before deploy
pnpm build
```

---

## License

Private project by [Swaniki](https://github.com/Suyashp07). All rights reserved.

---

<p align="center">
  Built with ☕ and 🔥 in Bhopal, India
</p>
