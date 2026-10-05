# PROJECT SYNOPSIS REPORT

---

## 1. PROJECT TITLE & METADATA

* **Project Title:** **Vibe by Swaniki**
* **Subtitle:** An AI-Powered Hyperlocal Event Lifecycle, Spontaneous Social Discovery, and Multi-Channel Communication Platform
* **Academic/Engineering Domain:** Full-Stack Software Engineering, Applied Artificial Intelligence (Multimodal Vision & NLP), Real-Time Distributed Messaging, Geolocation Systems
* **Target Platforms:** Progressive Web Application (Desktop & Mobile Responsive), Telegram Bot Interface, WhatsApp Bridge Integration
* **Production Deployment:** [vibe-seven-pied.vercel.app](https://vibe-seven-pied.vercel.app)
* **Author / Developer:** Suyash Pandey (Swaniki)

---

## 2. EXECUTIVE SUMMARY / ABSTRACT

In the contemporary digital landscape, event planning and social gathering discovery remain heavily fragmented. Legacy ticketing platforms (e.g., BookMyShow, Eventbrite) are transactional, restrictive, and characterized by steep commission fees and manual, friction-heavy event creation. Conversely, modern Western alternatives like Luma and Partiful cater primarily to niche tech networks and lack deep integrations with regional Indian communication modalities such as WhatsApp and Telegram, as well as spontaneous, impromptu meetup capabilities.

**Vibe by Swaniki** is an end-to-end, full-stack event lifecycle platform designed to modernize how organizers create, curate, manage, and discover in-person, online, and hybrid gatherings. Powered by **Next.js 14 (App Router)**, **TypeScript**, **Supabase (PostgreSQL with Row Level Security)**, and **Google Gemini Multimodal AI**, Vibe introduces zero-friction event publishing:
1. **Multimodal Event Extraction:** Allows organizers to create published events in under 30 seconds simply by uploading a promotional poster flyer, pasting an external ticketing link, or entering unstructured natural language.
2. **Dynamic Curation & Surety Engine:** Incorporates an algorithmic confidence scoring pipeline (AI Surety Score) that auto-approves verified events while routing incomplete drafts to human curators.
3. **Spontaneous Discovery ("Vibe Instant"):** A vertical, swipeable micro-event feed tailored for impromptu turf sports, cafe co-working, board games, and acoustic jam sessions.
4. **Omnichannel Communication Gateway:** Solves guest-host friction via RSVP-gated direct Q&A messaging, host broadcast announcements, bidirectional WhatsApp Web bridging via Baileys, and Telegram supergroup curation bot integration (`@VibeConsoleBot`).
5. **Digital QR Passes & Check-in:** Offline-compatible digital ticket passes with unique QR codes and attendance management.

---

## 3. PROBLEM STATEMENT & MOTIVATION

### 3.1 Core Industry Problems
1. **High Friction in Event Creation:** Traditional platforms require organizers to fill out 20+ form fields (dates, times, venue coordinates, ticketing rules, categories, descriptions). Most promotional assets already exist in flyers, posters, or social media blurbs, yet organizers must manually transcribe them.
2. **Absence of Impromptu / Flash Gathering Infrastructure:** Mainstream platforms prioritize commercial events scheduled weeks in advance. No platform effectively facilitates finding or hosting spontaneous "right now" activities (e.g., "Need 2 players for badminton turf at 7 PM" or "Co-working sprint at Blue Tokai").
3. **Fragmented Host-Guest Communication:** Organizers rely on disconnected WhatsApp groups or spammy email lists. Guests struggle to ask private logistical questions without disclosing their phone numbers publicly.
4. **Regional Unsuitability for India:** International platforms ignore Indian communication channels (WhatsApp/Telegram ubiquity), local city aliases (Delhi NCR, Gurugram, Bengaluru vs. Bangalore), and regional payment preferences.

### 3.2 Motivation & Objectives
The goal of Vibe by Swaniki is to deliver a friction-free platform rivaling Luma and Partiful in aesthetic appeal and developer craftsmanship, while exceeding them through multimodal AI automation and tailored integrations for the Indian social ecosystem.

---

## 4. SYSTEM ARCHITECTURE & HIGH-LEVEL DESIGN

### 4.1 Architectural Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT INTERFACES                             │
│  Desktop & Mobile Browsers  │   Telegram Bot Client  │   WhatsApp App  │
│  (Next.js SSR + Client)     │   (@VibeConsoleBot)    │   (End User)    │
└───────────────┬─────────────┴───────────┬────────────┴────────┬────────┘
                │                         │                     │
                ▼                         ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 14 APPLICATION ROUTER                        │
│                                                                        │
│  ┌────────────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │    App Pages & UI      │  │ Server Actions │  │ Edge Middleware  │  │
│  │ (SSR, ISR, CSR Views)  │  │ & Data Loaders │  │ (RBAC Auth Guard)│  │
│  └───────────┬────────────┘  └───────┬────────┘  └────────┬─────────┘  │
│              │                       │                    │            │
│              ▼                       ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        REST API ENGINE                           │  │
│  │  /api/events/*      │ /api/ai/extract     │ /api/telegram/*      │  │
│  │  /api/rsvps/*       │ /api/ai/generate    │ /api/whatsapp/*      │  │
│  │  /api/communication │ /api/admin/*        │ /api/auth/*          │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌─────────────────┐          ┌───────────────────┐          ┌───────────────────┐
│    SUPABASE     │          │     GOOGLE AI     │          │  WHATSAPP BRIDGE  │
│   PostgreSQL    │          │  Gemini 2.5 Flash │          │ (Node.js/Baileys) │
│ Auth + RLS + S3 │          │  Vision OCR + NLP │          │  Port 3002/Render │
│ Realtime Engine │          │  Multimodal API   │          │ Persistent Daemon │
└─────────────────┘          └───────────────────┘          └───────────────────┘
```

### 4.2 Architectural Layers

1. **Presentation Layer:** Next.js 14 App Router leveraging React 18, Tailwind CSS, Lucide icons, and Framer Motion. Uses a District by Zomato and Luma-inspired design system with tactile pill controls, sticky navigation bars, responsive bottom bars, and adaptive modal sheets.
2. **API & Edge Routing Layer:** Force-dynamic Next.js route handlers executing on Node.js/Edge runtimes. Handles request authentication, payload validation, sliding-window rate limiting, and automated webhook distribution.
3. **Intelligence Layer:** Google Generative AI (Gemini 2.5 Flash, 2.0 Flash) configured with strict JSON schemas for OCR poster parsing, Jina AI crawler-based page scraping, and dynamic content enrichment.
4. **Persistence Layer:** Supabase PostgreSQL with strict Row Level Security (RLS) policies, foreign key cascades, automatic triggers for user synchronization, and S3-compatible Supabase Storage buckets for high-resolution event media and logos.
5. **Real-Time Communication Layer:** Hybrid persistence combining Supabase Realtime publication streams, fallback in-memory global state, and asynchronous adapters bridging web chat sessions with Telegram and WhatsApp.

---

## 5. EXHAUSTIVE FEATURE SPECIFICATIONS

### 5.1 Multimodal AI Event Ingestion Engine
* **Poster Flyer Vision OCR:** Organizers upload flyer images (PNG, JPEG, WebP). The image is converted to Base64 and sent directly to Gemini Vision models with a prompt tuned to recognize Indian event formats, venue references, dates, and ticket prices.
* **URL Crawler & JSON-LD Parser:** Accepts URLs from ticketing hubs (BookMyShow, Insider, Luma, Townscript). Scrapes listings via Jina Reader, extracts `schema.org` structured data, cleans HTML meta tags, and generates normalized event entities.
* **Natural Language Blurb Prompting:** Users can input messy WhatsApp forwards or informal blurbs. The AI resolves colloquial expressions (e.g., "this coming Sunday 6pm", "entry ₹499", "near Indiranagar metro") into strict ISO-8601 timestamps and mapped coordinates.
* **Banner Extraction & Fallback Aesthetics:** Extracts authentic venue or artist banners from scraped pages without hallucination, pairing events with curated thematic cover banners if no image is supplied.

### 5.2 Intelligent Event Surety & Auto-Approval Engine
* **Algorithmic Surety Scoring (`eventSurety.ts`):** Calculates an automated data-completeness score (0% to 100%) based on 6 core criteria:
  1. Valid Title & Tagline (20 pts)
  2. Concrete Date and Start Time (20 pts)
  3. Identified City & Detailed Venue Address (20 pts)
  4. Descriptive Overview & Agenda (15 pts)
  5. High-Resolution Cover Asset (15 pts)
  6. Verified Contact / Host Identity (10 pts)
* **Auto-Approval vs. Moderation Queue:**
  * **Score ≥ 90%:** Automatically marked as `status: 'live'` and indexed for immediate public discovery.
  * **Score < 90%:** Transitioned to `status: 'draft'`, tagged with specific missing criteria badges, and routed to the Admin Review Queue.

### 5.3 Dual-Track Event Creation Studio
1. **1-Click AI Fast Track (`/create/ai`):** A 30-second workflow where the host uploads a flyer or enters a link. The AI populates the form in real time, generates catchy taglines, drafts FAQs, and publishes with zero manual typing required.
2. **Custom Event Studio (`/create/manual`):** A granular creation studio giving organizers complete creative control:
   * Interactive Google Maps / OpenStreetMap pin coordinate selection.
   * Ticketing parameters: Free Entry, Paid Passes (INR ₹), Capacity Limits, Waitlisting rules.
   * Custom RSVP Questionnaires: T-shirt sizes, dietary restrictions, LinkedIn/portfolio handles, "+1" guest allowances.
   * Dynamic Section Toggles: Speakers, Agenda timeline, Media gallery, FAQ accordion.

### 5.4 Dynamic Event Page Templating & Design System
Each event slug (`/[slug]`) dynamically renders with bespoke visual templates reflecting the event's subculture:
* **Grove:** Earthy, organic forest palette and serif typography (ideal for literature festivals, retreats, eco-workshops).
* **Sprint:** High-contrast tech and startup theme (hackathons, demo days, developer summits).
* **Bloom:** Vibrant, playful gradients and modern sans-serifs (art mixers, creative meetups, comedy nights).
* **Vertex:** Minimalist dark mode with neon accents (electronic music, nightlife, gaming LANs).
* **Ember:** Warm, rich amber tones (intimate dinners, acoustic baithaks, poetry readings).

### 5.5 RSVP Lifecycle & Digital QR Pass Engine
* **One-Click RSVP:** Seamless registration for authenticated users or quick-checkout for guests with instant validation.
* **Waitlist Engine:** When capacity is reached, new registrants are automatically placed on a prioritized waitlist. Hosts can approve waitlisted attendees with 1 click.
* **Unique Digital Pass Generation (`/passes`):**
  * Generates an Apple Wallet-style digital pass containing dynamic event data, pass holder name, ticket status badge, and venue details.
  * Embedded **QR Code**: Encodes unique RSVP IDs for rapid physical check-in at the door.
  * Offline Availability: Cached in client-side state for offline presentation at venues with poor network coverage.
* **Confirmation & Host Notification:** Automated email dispatch via Nodemailer (Gmail SMTP) delivering instant RSVP confirmations and calendar invitations (.ics).

### 5.6 "Vibe Instant" (Spontaneous Flash Meetup Engine)
* **Concept:** Inspired by short-form vertical feeds (TikTok/Instagram Reels), `/vibes` caters to impromptu social activities occurring within the next 2 to 24 hours.
* **Vertical Reel Cards:** Full-viewport cards showing activity title, urgency countdown timer ("Happening in 2 hrs"), verified host, venue distance, and attendee avatars.
* **Activity Categories:** Sports & Turf (Cricket, Badminton, Pickleball), Chai & Hangouts, Tabletop & Board Games, Jam Sessions, Co-working Sprints.
* **Instant RSVP ("I'm In ⚡"):** A 1-tap modal to claim spot quotas in seconds without complex forms.

### 5.7 RSVP-Gated Multi-Channel Communication Gateway
* **Anti-Spam RSVP Gate:** Unverified users cannot message the host directly. Guests must submit an RSVP before unlocking the "Ask Host 💬" conversation portal.
* **1-on-1 Realtime Q&A:** A dedicated conversation thread per guest-host pair for private logistical queries (parking, dress code, schedule changes).
* **Host Broadcast Announcements:** Organizers can send urgent announcements targeting "All Attendees", "Confirmed Only", or "Waitlisted Only", with optional instant email blasts.
* **Sliding-Window Rate Limiting:** Enforces a maximum of 10 messages per minute per guest to eliminate bot spam.

### 5.8 Omnichannel Bot Automations
1. **Telegram Curator Bot (`@VibeConsoleBot`):**
   * Curators or hosts drop event flyers or URLs directly into designated Telegram groups.
   * Gemini Vision extracts event specifications and replies with an inline interactive preview card.
   * Curators tap inline callback buttons (✅ Approve & Publish, ✏️ Edit, ❌ Discard) to control the live platform directly from Telegram.
2. **Baileys WhatsApp Bridge:**
   * Built on `@whiskeysockets/baileys` to connect real WhatsApp phone numbers to the platform via a persistent headless Node.js service.
   * Relays web guest messages to the host's WhatsApp chat with contextual badges (`✅ RSVP'd Guest`).
   * Captures host WhatsApp replies and delivers them back into the guest's Vibe web chat in real time.

### 5.9 Hyperlocal Discovery & Geolocation Engine
* **GPS & City Detection:** Utilizes browser Geolocation APIs backed by OpenStreetMap Nominatim reverse geocoding to automatically detect the user's city.
* **Haversine Distance Matrix:** Computes exact spherical distances between user coordinates and venue coordinates, ranking events by physical proximity.
* **Pan-India City Taxonomy:** Pre-configured coordinate databases and alias resolution covering Delhi NCR (Gurgaon, Noida, Delhi), Mumbai, Bengaluru, Pune, Hyderabad, Chennai, Kolkata, Bhopal, Goa, Jaipur, and Chandigarh.

### 5.10 Enterprise Administration & Moderation Console (`/admin`)
* **Live Event Queue:** Tabbed sorting across Live, Draft, Needs Review, and Cancelled events.
* **Duplicate Detection (`dedup.ts`):** Employs fuzzy string similarity (Levenshtein distance) and date-venue collision detection to warn admins of duplicate listings imported from multiple sources.
* **Full In-Place Event Editor:** Admin modal allowing fine-tuning of dates, times, categories, coordinates, and ticketing links before publishing.
* **User & Role Administration:** Super-admin capabilities to promote users across 4 RBAC tiers: `guest`, `organizer`, `curator`, and `super_admin`.
* **Immutable Audit Trail (`admin_audit_logs`):** Append-only logging capturing every administrative action (publish, edit, discard, role change) with actor email, timestamp, IP, and payload metadata.

### 5.11 Interactive Date & Time Polling (`/poll`)
* Organizers uncertain of the optimal gathering date can launch collaborative date polls.
* Participants vote on multiple proposed time slots without needing to create accounts.
* Visual progress bars show consensus, allowing the organizer to convert the winning slot into a live event with one click.

---

## 6. COMPLETE DATABASE SCHEMA & DATA MODELS

### 6.1 Database Architecture Overview
The persistence layer runs on Supabase (PostgreSQL 15), structured into 3 modular migration schemas:
1. `schema.sql` — Core entities (profiles, events, rsvps, comments, follows, polls).
2. `admin_schema.sql` — Security, audit trails, curator management.
3. `communication_schema.sql` — 1-on-1 conversations, messages, announcements.

### 6.2 Entity Specifications

#### 1. `public.profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, REFERENCES auth.users | Maps to Supabase Auth UID |
| `name` | `text` | NOT NULL | User's full display name |
| `email` | `text` | NOT NULL | User's primary email address |
| `handle` | `text` | UNIQUE | Distinct username handle (e.g. `@suyash`) |
| `role` | `text` | CHECK ('super_admin', 'curator', 'organizer', 'guest') | RBAC authorization role |
| `bio` | `text` | NULLABLE | Organizer biography or guest bio |
| `logo_url` | `text` | NULLABLE | Avatar or brand logo URL |
| `brand_color`| `text` | DEFAULT '#E8621A' | Custom brand accent color |
| `brand_font` | `text` | DEFAULT 'Playfair Display' | Selected brand typography |
| `phone` | `text` | NULLABLE | Contact telephone |
| `onboarded` | `boolean` | DEFAULT false | Flags onboarding completion |
| `created_at`| `timestamptz` | DEFAULT now() | Account creation timestamp |

#### 2. `public.events`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique event ID |
| `organizer_id` | `uuid` | REFERENCES profiles(id) | Event host reference |
| `slug` | `text` | UNIQUE, NOT NULL | Clean URL slug (e.g. `bhopal-ai-summit-2026`) |
| `title` | `text` | NOT NULL | Title of the event |
| `tagline` | `text` | NULLABLE | Short 8-12 word promotional hook |
| `description`| `text` | NULLABLE | Markdown / rich text description |
| `cover_image_url` | `text` | NOT NULL | Event banner image URL |
| `template` | `text` | CHECK ('grove', 'sprint', 'bloom', 'vertex', 'ember') | Theme design template |
| `theme` | `jsonb` | DEFAULT styling JSON | Theme customization tokens |
| `event_type`| `text` | CHECK ('in-person', 'online', 'hybrid') | Gathering format |
| `location_name` | `text` | NOT NULL | Venue name or online meeting platform |
| `location_address` | `text` | NOT NULL | Physical street address |
| `city` | `text` | DEFAULT 'Mumbai' | Primary city index |
| `location_lat` | `float8` | NULLABLE | Latitude for geolocation |
| `location_lng` | `float8` | NULLABLE | Longitude for geolocation |
| `start_at` | `timestamptz` | NOT NULL | Event start date and time |
| `end_at` | `timestamptz` | NOT NULL | Event end date and time |
| `timezone` | `text` | DEFAULT 'Asia/Kolkata' | Event timezone |
| `capacity` | `int4` | NULLABLE | Guest capacity limit |
| `is_public` | `boolean` | DEFAULT true | Visibility index flag |
| `status` | `text` | CHECK ('draft', 'live', 'past', 'cancelled') | Lifecycle stage |
| `ai_generated` | `boolean` | DEFAULT false | Flagged if created via AI pipeline |
| `faq` | `jsonb` | DEFAULT '[]'::jsonb | Array of `{ question, answer }` |
| `speakers` | `jsonb` | DEFAULT '[]'::jsonb | Array of `{ name, role, avatar, bio }` |
| `agenda` | `jsonb` | DEFAULT '[]'::jsonb | Array of `{ time, title, description }` |
| `rsvp_form_config` | `jsonb` | Form settings | Custom RSVP questionnaire toggles |

#### 3. `public.rsvps`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique registration identifier |
| `event_id` | `uuid` | NOT NULL, REFERENCES events(id) ON DELETE CASCADE | Target event |
| `name` | `text` | NOT NULL | Attendee full name |
| `email` | `text` | NOT NULL | Attendee email |
| `phone` | `text` | NOT NULL | Attendee phone number |
| `status` | `text` | CHECK ('confirmed', 'waitlisted', 'cancelled') | RSVP status |
| `plus_one_name` | `text` | NULLABLE | Accompanying guest name |
| `custom_responses` | `jsonb` | DEFAULT '{}'::jsonb | Dynamic questionnaire responses |
| `created_at` | `timestamptz` | DEFAULT now() | Registration timestamp |

#### 4. `public.audit_logs`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `created_at` | `timestamptz` | Timestamp of administrative event |
| `actor_id` | `uuid` | Admin user identifier |
| `actor_email` | `text` | Email of acting administrator |
| `actor_role` | `text` | Role tier (`super_admin`, `curator`) |
| `action` | `text` | Action code (`event.publish`, `event.discard`, etc.) |
| `target_type` | `text` | Entity type (`event`, `rsvp`, `profile`) |
| `target_id` | `text` | Primary key of target entity |
| `ip_address` | `text` | Client IP address |
| `metadata` | `jsonb` | Contextual diff / payload snapshot |

#### 5. `public.telegram_curators`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `telegram_user_id` | `bigint` | Unique Telegram numeric User ID |
| `name` | `text` | Curator full name |
| `username` | `text` | Telegram `@handle` |
| `role` | `text` | `super_admin` or `curator` |
| `is_active` | `boolean` | Revocation toggle |

#### 6. `public.event_conversations` & `public.event_messages`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `event_id` | `uuid` | Referenced Event |
| `sender_role` | `text` | `guest` or `host` |
| `sender_email` | `text` | Message author email |
| `recipient_email` | `text` | Message target email |
| `subject` / `message` | `text` | Message body content |
| `is_read` | `boolean` | Read delivery receipt |

---

## 7. TECHNOLOGY STACK & SYSTEM SPECIFICATIONS

| Layer / Component | Technology | Version | Purpose & Technical Justification |
|---|---|---|---|
| **Core Framework** | Next.js (App Router) | `14.2.15` | Server-Side Rendering (SSR), API Route Handlers, React Server Components, SEO optimization |
| **Language** | TypeScript | `5.6.3` | End-to-end type safety across UI models, database entities, and API payloads |
| **Runtime Environment** | Node.js | `24.x` | Modern JavaScript runtime supporting top-level await, native fetch, and high I/O throughput |
| **Styling & Design** | Tailwind CSS | `3.4.14` | Utility-first CSS, custom design tokens, responsive breakpoints, fluid micro-interactions |
| **Motion & Animation** | Framer Motion | `11.11.17` | Smooth page transitions, layout animations, swipeable reel cards |
| **Database & Auth** | Supabase | `@supabase/supabase-js 2.116.0` | Managed PostgreSQL with native Row Level Security, Auth engine, and real-time sockets |
| **SSR Auth Helpers** | Supabase SSR | `@supabase/ssr 0.12.7` | Secure cookie-based session handling across Next.js server components and client code |
| **AI Intelligence** | Google Generative AI | `@google/generative-ai 0.21.0` | Google Gemini 2.5 Flash / 2.0 Flash for multimodal vision extraction and NLP structuring |
| **WhatsApp Protocol** | Baileys | `@whiskeysockets/baileys 7.0.0-rc14` | Headless, direct WebSocket connection to WhatsApp Web multi-device protocol |
| **Email Transport** | Nodemailer | `10.0.1` | SMTP client connecting to Google Mail Gateway for instantaneous HTML RSVP delivery |
| **QR Code Engine** | QRCode | `1.5.4` | High-density 2D matrix barcode rendering for digital entry passes |
| **Web Crawling** | Jina Reader API | REST | Markdown-first web scraper converting external ticketing URLs into clean LLM context |
| **Package Manager** | pnpm | Latest | Deterministic, disk-efficient dependency resolution via hard links |
| **Hosting Platform** | Vercel & Render | Cloud | Vercel for frontend/serverless API edge functions; Render for long-lived Baileys WhatsApp daemon |

---

## 8. COMPLETE API SPECIFICATIONS DIRECTORY

### 8.1 Events API (`/api/events/*`)
* `GET /api/events/list`: Fetches public, live events. Supports query filtering by `city`, `category`, `timeframe`, and `search`.
* `GET /api/events/by-slug?slug=:slug`: Fetches full event specification including theme, sections, organizer metadata, and confirmed attendee count.
* `POST /api/events/ai-create`: Ingests parsed AI payload, validates surety score, resolves organizer profile, and commits event to database.
* `POST /api/events/like`: Toggles event like count in real time.
* `DELETE /api/events/delete`: Allows authorized organizers or super-admins to unpublish or soft-delete an event.

### 8.2 AI Extraction API (`/api/ai/*`)
* `POST /api/ai/extract`: Accepts `{ url, imageBase64, imageMimeType, text }`. Dispatches Jina web scraping or Gemini Multimodal Vision analysis, returning normalized JSON matching the event schema.
* `POST /api/ai/generate`: Generates promotional assets (WhatsApp broadcast captions, Instagram stories, contextual FAQs, speaker bios).

### 8.3 RSVP & Pass API (`/api/rsvps/*`)
* `POST /api/rsvps/create`: Submits a guest RSVP. Validates capacity constraints, updates attendee counts, generates unique ticket UUID, and triggers confirmation email.
* `GET /api/rsvps/list?eventId=:id`: Returns list of confirmed and waitlisted attendees (restricted to event owner or super-admin).
* `POST /api/rsvps/update-status`: Enables hosts to accept waitlisted guests or cancel passes.

### 8.4 Communication API (`/api/communication/*`)
* `POST /api/communication/conversations`: Finds or initializes a 1-on-1 conversation thread between host and guest. **Enforces RSVP verification gate.**
* `GET /api/communication/conversations?userId=:id`: Retrieves active conversation inbox for the authenticated user.
* `POST /api/communication/conversations/[id]/messages`: Sends a text message within a thread; routes copy to host's WhatsApp/Telegram if configured.
* `POST /api/communication/announcements`: Broadcasts message to all confirmed attendees with optional email delivery.

### 8.5 Administration API (`/api/admin/*`)
* `GET /api/admin/events`: Returns event curation queue sorted by status, date, and AI surety score.
* `POST /api/admin/events/from-url`: Administrative endpoint to scrape, deduplicate, and publish external listings.
* `GET /api/admin/users`: Lists registered profiles and handles role elevation.
* `GET/POST /api/admin/curators`: Manages authorized Telegram bot curators.
* `GET /api/admin/audit-logs`: Retrieves immutable audit log stream with pagination.

### 8.6 Webhook Endpoints (`/api/telegram/*`, `/api/whatsapp/*`)
* `POST /api/telegram/webhook`: Ingests Telegram Bot API updates (photo messages, link shares, inline button callbacks).
* `POST /api/whatsapp/webhook`: Ingests incoming WhatsApp messages from the Baileys bridge and syncs with web chat threads.
* `GET /api/whatsapp/bridge-info`: Returns WhatsApp Web bridge connection and socket health status.

---

## 9. SECURITY, PRIVACY & RELIABILITY MEASURES

1. **Row Level Security (RLS):** Every database table in Supabase enforces granular RLS policies. Public users have read access only to published events and sanitized profiles. Sensitive operational tables (`audit_logs`, `telegram_curators`) require role verification via `auth.uid()`.
2. **Edge Authentication Guard (`middleware.ts`):** Edge middleware intercepts all requests matching `/admin` or `/admin/*`. Validates session tokens against Supabase Auth and checks user role tier. Unauthorized users are immediately redirected to `/login?redirect=/admin`.
3. **Sliding-Window Rate Limiting:** Applied to guest-host communication to guard against message spam and brute-force inquiries.
4. **Zero-PII Public Exposure:** Phone numbers and email addresses of registered guests are shielded from the public interface and exposed only to the verified organizer of the specific event.
5. **Defensive AI Parsing:** All Gemini AI outputs pass through JSON extraction cleaning regex and schema validation layers to eliminate Markdown code block artifacts or malformed responses.

---

## 10. PROJECT HIGHLIGHTS & INNOVATIONS (SYNOPSIS SUMMARY)

| Feature | Legacy Platforms (BookMyShow, etc.) | Global Competitors (Luma, Partiful) | Vibe by Swaniki |
|---|---|---|---|
| **Event Creation Speed** | 10–20 minutes (Manual data entry) | 3–5 minutes (Manual form filling) | **< 30 seconds (1-Click Multimodal AI Flyer OCR)** |
| **Spontaneous Discovery** | Non-existent | Minimal (Calendar list view) | **"Vibe Instant" Reel-Style Flash Meetup Feed** |
| **Regional Messaging** | Generic Email / SMS notifications | Email only | **Bidirectional WhatsApp Bridge & Telegram Bot** |
| **Confidence Scoring** | Manual editorial review | No validation | **Automated AI Surety Score (0–100%)** |
| **Ticketing Friction** | Mandatory account & convenience fees | Clean UI, USD centric | **0% Host Fees, INR ₹ Localized, Apple-Style Passes** |
| **Host-Guest Chat** | Disconnected support forms | Basic comments | **RSVP-Gated Direct 1-on-1 Q&A Portal** |

---

## 11. CONCLUSION & FUTURE SCOPE

**Vibe by Swaniki** presents a production-grade, highly cohesive web application that synthesizes state-of-the-art web technologies with practical multimodal AI engineering. By eliminating event creation friction through automated flyer vision extraction, introducing spontaneous flash gatherings via Vibe Instant, and bridging the gap between web applications and everyday messaging apps (Telegram & WhatsApp), Vibe establishes a new benchmark for social gathering platforms in India.

### Future Roadmap:
* **UPI & Payment Gateway Integration:** Razorpay / Cashfree integration for automated instant ticket payouts.
* **Apple Wallet / Google Wallet Native Passes:** Native `.pkpass` generation for iOS and Android wallets.
* **Autonomous AI Host Concierge:** Automated AI responses for frequent guest questions (parking, dress code, schedule) based on event description context.
* **Decentralized Ticket Verification:** Cryptographically signed QR passes to prevent ticket duplication at large venue doors.
