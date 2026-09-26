# 📋 VIBE — Version Control Changelog

> **Project**: Vibe by Swaniki  
> **Repository**: [github.com/Suyashp07/Vibe](https://github.com/Suyashp07/Vibe)  
> **Total Commits**: 151  
> **Timeline**: Sep 10, 2026 → Sep 26, 2026  
> **Branch**: `main`

---

## v0.9.0 — RSVP Gate & External Events Focus (Sep 25–26, 2026)

> Anti-spam RSVP gate for Vibe Instant. Guests must RSVP before messaging hosts. External event focus — removed native RSVP CTA.

| Commit | Date | Change |
|--------|------|--------|
| `d826cfa` | Sep 26 | **fix(ui):** Remove organizer name and "RSVP on Vibe" from event cards — replaced with "View Details →" |
| `52b8598` | Sep 25 | **fix(rsvp-gate):** Robust RSVP lookup by phone, email, and event UUID with 3-strategy fallback |
| `a2b7431` | Sep 25 | **fix(deploy):** Use Node.js 24.x for Vercel, refresh pnpm lockfile |
| `b8aa1c9` | Sep 25 | **fix(deploy):** Pin Node.js version to prevent Vercel auto-upgrade breakage |
| `bbd8e4e` | Sep 25 | **feat(rsvp-gate):** Implement Option A "RSVP-First, Chat-Later" gate on Vibe Instant cards |

### Files Modified
- `src/components/vibes/VibeReelCard.tsx` — "Contact Host" → "I'm In ⚡" / "Ask Host 💬"
- `src/components/vibes/QuickJoinModal.tsx` — Post-RSVP chat unlock UX
- `src/lib/store.ts` — Added `hasUserRSVP()` helper
- `src/lib/communication/adapters/whatsappAdapter.ts` — RSVP-tagged host messages
- `src/app/api/communication/conversations/route.ts` — Server-side RSVP gate (403)
- `src/components/ui/EventCard.tsx` — Removed organizer row + RSVP on Vibe CTA
- `package.json` — Node.js 24.x engine pin

---

## v0.8.0 — WhatsApp Bridge Deployment (Sep 25, 2026)

> Persistent WhatsApp bridge for Render hosting. Bridge compiles to plain JS for production stability.

| Commit | Date | Change |
|--------|------|--------|
| `274c415` | Sep 25 | **feat(whatsapp):** Compile bridge to plain JS `dist/whatsapp-bridge.js` for native node execution |
| `7a15636` | Sep 25 | **fix(whatsapp):** Use `tsconfig.scripts.json` and move tsx to dependencies for Render |
| `e6796d1` | Sep 25 | **feat(whatsapp):** Bind to `process.env.PORT` for Render hosting compatibility |
| `d1995dd` | Sep 25 | **fix(whatsapp):** Provide live event pass link alongside Vibe Instant link in confirmations |

### Files Modified
- `scripts/whatsapp-bridge.ts` — PORT binding, Render-compatible execution
- `tsconfig.scripts.json` — Created for backend script compilation
- `package.json` — Build scripts for WhatsApp bridge

---

## v0.7.0 — AI & UI Refinements (Sep 25, 2026)

> Gemini model upgrades, JSON-LD extraction, Flash Vibe branding cleanup, event moderation fix.

| Commit | Date | Change |
|--------|------|--------|
| `83caf4e` | Sep 25 | **fix(ui):** Remove FLASH VIBE badge and labels from Vibe Instant reel cards |
| `810793f` | Sep 25 | **fix(telegram, vibes):** Fix event 404 links, upgrade to gemini-3.5 models, direct target event loading |
| `a768f33` | Sep 25 | **fix(ai):** Extract schema.org JSON-LD for accurate venue, address, timings from ticketing URLs |
| `6e3f063` | Sep 25 | **fix(moderation):** Strictly prevent unapproved events from displaying on public site |
| `31a6299` | Sep 25 | **fix(telegram):** Enforce 64-byte `callback_data` limit with resilient retry |
| `16bb5af` | Sep 25 | **fix(ai):** Update Gemini models to valid SDK names, add error reply handling |

### Files Modified
- `src/lib/ai/eventExtractor.ts` — JSON-LD parsing, model upgrades, city mapping
- `src/app/api/whatsapp/webhook/route.ts` — Dynamic URL resolution
- `src/app/vibes/page.tsx` — Target event deep-linking
- `src/components/vibes/VibeReelCard.tsx` — Flash Vibe branding removal

---

## v0.6.0 — Telegram Bot & Event Publishing (Sep 24–25, 2026)

> Telegram bot event creation, admin approval workflows, auth improvements.

| Commit | Date | Change |
|--------|------|--------|
| `1375d74` | Sep 25 | **fix(telegram):** Allow unmapped topic messages to proceed to AI event creation |
| `bcb91f0` | Sep 25 | **fix(bots):** Publish events created via Telegram and WhatsApp bots live immediately |
| `bc25e45` | Sep 25 | **feat(auth):** Display 'Provided email is invalid' error on signup page |
| `d69fb19` | Sep 25 | **fix(events):** Fix AI event creation parameter mapping and Supabase persistence |
| `753a366` | Sep 25 | **feat(auth):** Enforce strict email validation and typo detection |

### Files Modified
- `src/app/api/telegram/webhook/route.ts` — Topic routing, event publishing
- `src/app/signup/page.tsx` — Email validation UI
- `src/lib/auth.ts` — Email typo detection

---

## v0.5.0 — Admin Panel & Dashboard (Sep 24, 2026)

> Executive dashboard UI, admin queue with filter tabs, AI surety auto-approval.

| Commit | Date | Change |
|--------|------|--------|
| `287e739` | Sep 24 | **feat(dashboard):** Workaholic executive UI with metrics, filter tabs, responsive layout |
| `5037d86` | Sep 24 | **feat(auth):** 6-digit email OTP verification on signup |
| `0c0df29` | Sep 24 | **fix(admin):** Reorder filter tabs — All, Live, Auto-Approved, Needs Approval, External, Rejected |
| `ef4452a` | Sep 24 | **refactor(admin):** Remove redundant 'Import Listing' modal |
| `a13cb30` | Sep 24 | **fix(admin):** Display 'View Draft' for unapproved events |
| `dc610d9` | Sep 24 | **fix(admin):** Full-width queue when no event selected |
| `9431193` | Sep 24 | **fix(telegram):** Remove curator authorization — all users can create events |
| `81da0ff` | Sep 24 | **refactor(admin):** Unified light workstation admin panel |
| `2a125f5` | Sep 24 | **feat(ai-surety):** 90% surety auto-approval, missing aspect tags, admin workflows |

### Files Modified
- `src/app/admin/` — Complete admin panel redesign
- `src/app/dashboard/page.tsx` — Executive dashboard
- `src/lib/eventSurety.ts` — Surety scoring algorithm

---

## v0.4.0 — WhatsApp Bot & Communication (Sep 22–24, 2026)

> WhatsApp event creation bot, host-guest communication gateway, Vibe Instant reels.

| Commit | Date | Change |
|--------|------|--------|
| `75b6996` | Sep 22 | **fix(whatsapp):** Ensure confirmation dispatched to sender |
| Multiple | Sep 20–22 | **feat(whatsapp):** Full WhatsApp bridge with Baileys, event extraction, Flash Vibe creation |
| Multiple | Sep 18–20 | **feat(communication):** Host-guest messaging, Telegram forum topics, conversation service |
| Multiple | Sep 17–18 | **feat(vibes):** Vibe Instant reels feed, VibeReelCard, CreateVibeModal |

### Key Files Created
- `scripts/whatsapp-bridge.ts` — Baileys WhatsApp Web bridge
- `src/app/api/whatsapp/webhook/route.ts` — WhatsApp ingestion webhook
- `src/lib/communication/conversationService.ts` — Conversation management
- `src/lib/communication/adapters/whatsappAdapter.ts` — WhatsApp adapter
- `src/components/vibes/VibeReelCard.tsx` — Reels-style event cards
- `src/app/vibes/page.tsx` — Vibe Instant page

---

## v0.3.0 — AI Event Intelligence (Sep 13–17, 2026)

> Gemini Vision OCR, Telegram bot, category detection, location engine.

| Commit | Date | Change |
|--------|------|--------|
| Multiple | Sep 13 | **feat(telegram):** Telegram bot ingestion with Gemini Vision and 1-tap publishing |
| Multiple | Sep 13 | **feat(ai):** Intelligent category & mood detection, curated editorial posters |
| Multiple | Sep 13 | **feat(location):** First-time location modal, proximity ranking, city coordinates |
| Multiple | Sep 13 | **feat(admin):** Security-hardened admin command center, edge middleware, RBAC |

### Key Files Created
- `src/lib/ai/eventExtractor.ts` — Gemini AI extraction engine
- `src/lib/location.ts` — Indian city coordinates & Haversine distance
- `src/app/api/telegram/webhook/route.ts` — Telegram bot webhook
- `src/middleware.ts` — Edge middleware for admin auth

---

## v0.2.0 — Email, RSVP Sync & Mobile (Sep 10, 2026)

> Gmail SMTP emails, real-time RSVP sync, QR passes, mobile responsive.

| Commit | Date | Change |
|--------|------|--------|
| `5b2e4c0` | Sep 10 | **feat:** Gmail SMTP via nodemailer for confirmation emails |
| `69bc497` | Sep 10 | **fix:** Persist RSVP status updates to Supabase |
| `6ff4698` | Sep 10 | **feat:** Automated event creation email and guest digital pass with QR |
| `1943990` | Sep 10 | **feat:** Real-time Supabase two-way RSVP sync |
| `082715b` | Sep 10 | **fix(mobile):** Navbar logo clipping and hero scaling |
| `0f35ef6` | Sep 10 | **feat:** Mobile responsive navigation drawer |

### Key Files Created
- `src/lib/email.ts` — Nodemailer email service
- `src/app/passes/page.tsx` — Digital pass with QR code
- `src/app/api/rsvps/` — RSVP API routes

---

## v0.1.0 — Foundation (Sep 10, 2026)

> Initial platform launch with event pages, RSVP forms, discover feed.

| Commit | Date | Change |
|--------|------|--------|
| `ed460ab` | Sep 10 | **feat:** Complete Vibe by Swaniki platform implementation |
| `d797467` | Sep 10 | **Initial commit** |

### Core Architecture
- **Framework:** Next.js 14.2.15 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Google Gemini (Vision OCR + NLP extraction)
- **Bots:** Telegram + WhatsApp (Baileys)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (web) + Render (WhatsApp bridge)

---

## 📁 Project File Map

```
vibe-by-swaniki/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/          # Admin API routes
│   │   │   ├── ai/             # AI extraction endpoints
│   │   │   ├── auth/           # Auth verification
│   │   │   ├── communication/  # Conversations & messages API
│   │   │   ├── events/         # Event CRUD
│   │   │   ├── rsvps/          # RSVP management
│   │   │   ├── telegram/       # Telegram bot webhook
│   │   │   └── whatsapp/       # WhatsApp bot webhook
│   │   ├── admin/              # Admin panel pages
│   │   ├── vibes/              # Vibe Instant reels
│   │   ├── dashboard/          # Organizer dashboard
│   │   └── [slug]/             # Dynamic event pages
│   ├── components/
│   │   ├── vibes/              # VibeReelCard, QuickJoinModal, CreateVibeModal
│   │   ├── communication/      # ConnectHostModal, EventConversationModal
│   │   └── ui/                 # EventCard, RSVPForm, shared components
│   └── lib/
│       ├── ai/                 # eventExtractor.ts (Gemini)
│       ├── communication/      # conversationService, adapters
│       ├── auth.ts             # Authentication
│       ├── store.ts            # Client-side state management
│       ├── location.ts         # Geo/city engine
│       ├── email.ts            # Nodemailer
│       └── eventSurety.ts      # AI surety scoring
├── scripts/
│   └── whatsapp-bridge.ts      # Baileys WhatsApp bridge
└── package.json                # Node 24.x, pnpm
```

---

*Last updated: Sep 26, 2026 12:54 IST*
