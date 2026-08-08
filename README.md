# SkillSwap — Your skills are worth something.

**Teach what you know. Learn what you love.**

SkillSwap is a premium peer-to-peer skill-exchange marketplace. People trade skills instead of money using a **Skill Credit** system: teach QGIS for an hour → earn 1 credit → spend it learning Python from someone else.

Built to feel like a funded startup product: the visual quality of Linear, the clarity of Airbnb, the friendliness of Duolingo, and the trust of a modern community marketplace.

---

## ✨ Feature overview

### Core (P0) — fully implemented
| Area | Details |
|---|---|
| Authentication | Email/password (bcrypt + Auth.js), Google OAuth (optional), JWT sessions, password reset via email architecture (Resend-compatible), account suspension, **email OTP verification** (6-digit code, 10-min expiry, hashed + timing-safe compare, 5-attempt lockout, 60s resend cooldown — login is blocked until verified) |
| Onboarding | 6-step wizard: teach skills → learn skills → experience → availability → location/timezone → photo & bio |
| Profiles | Public premium profile: header, bio, skills (teach/learn + levels), availability, reviews, achievements, verified badge |
| Skills | 45-skill curated catalogue across 11 categories; public SEO skill pages (`/skills/python`) |
| Discover | Filterable people feed (search, category, skill, level, language, session type, min rating) with pagination + infinite scroll |
| Matching engine | Real compatibility service: two-way skill swap fit, experience fit, language, availability, timezone, location, reputation → 0–98% score with human-readable reasons |
| Swap requests | Request modal (want ↔ offer + message), accept/reject/block, auto-opens a conversation on accept |
| Messaging | Conversation list, real chat (text, emoji, image/file upload), polling, unread badges, **Propose a session** button |
| Sessions | Booking (date/time/duration/type), request → confirm (charges learner) → complete (pays teacher) → cancel (refunds), meeting links, review modal |
| Skill Credits | Every movement is a transaction: `BONUS` (+3 welcome), `EARNED`, `SPENT`, `REFUND`, `ADMIN_ADJUSTMENT` — never a silent balance change |
| Wallet | Balance, earned/spent totals, balance history chart, full transaction ledger |
| Reviews | 5-star + tags + comment; aggregates roll into profile rating |
| Notifications | New match, swap request, request accepted, message, session reminder, session completed, review, credit events — bell + inbox + unread counts |

### P1 — implemented
Notifications center · Admin dashboard (metrics, user management, credits adjustment, skills CRUD, session handling, report/dispute resolution) · Global debounced search (users/skills/categories) · Dark mode (light/dark/system, carefully designed) · PWA (manifest, icons, service worker) · Reports & safety (report user/session, block, suspended flow) · Legal pages (Terms, Privacy, Guidelines, Safety Center) · SEO (metadata, sitemap, robots, OG image)

### P2 — architected, not built (by design)
Payments (Stripe/Razorpay-ready wallet abstraction), video calls (meeting-url abstraction), AI matching/learning plans, communities, certificates, push notifications. The service layer is structured so these slot in without rewrites.

---

## 🧱 Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, custom shadcn-style UI primitives, Framer Motion, Recharts, Lucide icons
- **Backend:** Next.js route handlers (`/app/api/**`) with a consistent response envelope `{ success, data }` / `{ success, error: { code, message } }`
- **Database:** SQLite via Node's built-in `node:sqlite` driver for the local demo; **`prisma/schema.prisma` is the canonical PostgreSQL schema** for production (the runtime schema mirrors it 1:1)
- **Validation:** Zod · **Forms:** React Hook Form + `@hookform/resolvers`
- **State:** Zustand (toasts), React Context (theme, session user)
- **Auth:** Auth.js (NextAuth v4) — credentials + optional Google
- **Icons:** Lucide · **Fonts:** Inter + Plus Jakarta Sans (self-hosted via Fontsource)

> **Why not Prisma in this sandbox?** Prisma's native engines are downloaded from `binaries.prisma.sh`, which is unreachable from this environment (and native adapter builds are blocked). The app therefore runs on `node:sqlite` — real SQL, real transactions, real indexes — behind a typed repository layer. The Prisma schema is kept in-repo, portable, and documented; switching to PostgreSQL + Prisma in production requires no model changes.

---

## 🚀 Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up the database + seed realistic demo data
npm run db:setup

# 3. Run it
npm run dev          # → http://localhost:3000
```

Production build:

```bash
npm run build && npm run start
```

### Demo accounts (seeded)

| Account | Email | Password |
|---|---|---|
| **Demo user (Sumit Sharma)** | `demo@skillswap.app` | `demo1234` (or `DEMO_PASSWORD` env) |
| **Admin** | `admin@skillswap.app` | `admin1234` (or `ADMIN_PASSWORD` env) |
| 24 community members | `firstname@example.com` | `skillswap123` |

Use the **"Try the demo account"** button on `/login` for a one-click demo login.

### Environment

Copy `.env.example` → `.env`. Everything works with defaults; add `GOOGLE_CLIENT_ID/SECRET` to enable Google sign-in and `RESEND_API_KEY` to send real emails (otherwise emails are logged to the console in dev).

---

## 🗺️ Project structure

```
app/
  (auth)/               # login, register, forgot/reset password, verify-email (OTP)
  (app)/                # authenticated app shell
    dashboard/ discover/ messages/ sessions/ wallet/ notifications/ settings/ admin/
  api/                  # 30+ route handlers (auth, users, skills, matches, sessions,
                        #   conversations, messages, reviews, wallet, notifications,
                        #   reports, uploads, admin)
  users/[username]/     # public premium profile
  skills/[slug]/        # public SEO skill pages
  page.tsx              # marketing landing page
components/
  ui.tsx                # design-system primitives (Button, Card, Modal, Tabs, Stars…)
  layout/  landing/  people/  messaging/  sessions/  dashboard/  legal/
db/
  schema.sql            # SQLite DDL (mirror of prisma/schema.prisma)
  seed.ts               # realistic demo data (25 users, 45 skills, matches, sessions…)
  init.ts
lib/
  db.ts                 # node:sqlite connection + typed query helpers + transactions
  auth.ts  session.ts   # NextAuth config + server-side session helpers
  matching.ts           # compatibility engine
  credits.ts            # ledger-backed credit service
  sessions.ts  messaging.ts  reviews.ts  matches.ts  notifications.ts  reports.ts  admin.ts  search.ts
  email.ts              # Resend-compatible email provider (dev sink)
prisma/schema.prisma    # canonical PostgreSQL schema for production
hooks/  types/  public/ (PWA assets, icons, og image)
```

**Rules of the codebase**

- Every credit movement goes through `awardCredits`/`spendCredits` — a transaction is always recorded.
- Server code never returns raw DB rows for users: `safeUser()`/`safeUserPublic()` strip email, hashes and tokens.
- All mutations validate with Zod before touching the database.
- Client code talks only to `/api/*` through `lib/client.ts` (uniform error handling + toasts).

---

## 🔀 The matching engine

`lib/matching.ts` computes a 0–98 compatibility score between two members:

1. **Skill swap fit (max 34):** they teach what you want to learn; you teach what they want → the *two-way exchange* SkillSwap is built around
2. **Experience fit (8):** their teaching level vs. your learning level
3. **Language overlap (10)**
4. **Timezone compatibility (10)** — real offset math with DST samples
5. **Availability overlap (10)** — weekly schedule windows
6. **Reputation (6)** · **Location proximity (5)** · cap at 98

Weights are intentionally opaque in the UI; members see only the score and friendly reasons ("Aarav teaches Python — exactly what you want to learn. Perfect two-way exchange — you teach QGIS in return.").

---

## 🔐 Security & trust

- Passwords hashed with bcrypt (10 rounds); JWT sessions; OAuth users upserted with their real DB id
- Authorization checks on every mutation (ownership, role, suspension)
- SQL is fully parameterized (no injection surface); Zod validation on all input
- Sensitive fields never serialized; API envelope hides internal details; friendly error pages (no raw server errors)
- Rate limiting middleware on auth endpoints (429 with a friendly message)
- Upload validation (mime allowlist, 4 MB cap), XSS-safe rendering (React escapes), security headers, strict referrer policy
- Safety features: report user/session, block, dispute resolution, suspension, verified badges, admin moderation console

---

## 📱 PWA & mobile

- Manifest + icons + service worker (network-first, static cache) → installable
- Dedicated **mobile bottom navigation**: Home · Discover · Messages · Sessions · Profile
- Chat is a full-screen native-feeling experience on mobile; filters use expandable panels; everything is responsive from 375px to 1440px+

---

## 🧭 Roadmap (architected, intentionally not built in the MVP)

Payments (Stripe/Razorpay) · video calls · AI skill matching & learning plans · session summaries · paid expert sessions · certificates · communities · group sessions · leaderboards · referrals · push notifications · native iOS/Android apps.

---

## 📄 License

MIT — built as a reference product. Demo data uses placeholder avatars from randomuser.me.
