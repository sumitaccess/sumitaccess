# Haatly architecture

Haatly is designed as a mobile-first hyperlocal marketplace for a village and nearby service area. The current repository contains a usable MVP shell plus the boundaries needed to grow into a production system without moving business rules into UI components.

## Runtime boundaries

```text
Browser / PWA
   │ relative /api requests
   ▼
Vite web app ───────────────┐
                            │ proxy in development
                            ▼
                       Express API
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          PostgreSQL      Maps       Payments / push
          via Prisma    Mapbox/OSM   Razorpay + FCM
```

- `src/` owns customer and workspace UI state. Components are grouped by experience in `src/App.tsx` for this first milestone; the next extraction step is `src/features/customer`, `src/features/merchant`, `src/features/rider`, and `src/features/admin`.
- `server/index.ts` owns the request boundary, input validation, server-side price calculation and order state history. The local implementation uses seeded memory so a new contributor can run the app without credentials.
- `prisma/schema.prisma` is the persistence contract. It includes users, role-based businesses, menu snapshots, orders, status history, payments/refunds, delivery assignments and locations, reviews, coupons, notifications, chat, support, pricing and audit logs.
- Browser code calls relative paths such as `/api/orders`; it never assumes that the API is on `localhost`. Vite proxies `/api` to the local API only during development.

## Core order flow

1. The customer selects one business and adds menu items to a basket.
2. `POST /api/orders` validates the request, looks up current catalog prices, checks the business minimum order, calculates fees/discounts on the server and stores a `PENDING` order.
3. A merchant accepts or rejects it. Every transition is appended to `orderStatusHistory` rather than overwriting the audit trail.
4. The dispatch service finds approved, online riders inside the configured area. Matching is intentionally behind the assignment boundary so distance, workload, acceptance rate and future scoring can evolve independently.
5. Location updates are accepted only for active delivery assignments. The production version should publish them to a WebSocket topic scoped to the order; the customer must never receive a rider location after completion or cancellation.
6. Payment provider webhooks, not browser callbacks, become the source of truth for UPI/card capture and refunds. COD remains a first-class payment method.

## API slices

| Slice | MVP endpoint examples | Production next step |
| --- | --- | --- |
| Discovery | `GET /api/businesses`, `GET /api/businesses/:id` | PostGIS radius search, pagination, cache headers |
| Orders | `POST /api/orders`, `GET /api/orders/:id` | Authenticated customer/merchant policies and Prisma transactions |
| Status | `PATCH /api/orders/:id/status` | State-machine guard, role policy and WebSocket events |
| Delivery | `POST /api/delivery/location` | Assignment auth, movement threshold, Redis pub/sub |
| Admin | `GET /api/admin/summary` | Admin RBAC, filters, audit trail and reporting jobs |
| Payments | schema-ready | Razorpay order creation, signature verification, webhook replay protection |

## Security decisions

- Passwords are represented by a `passwordHash`; raw passwords never belong in the API model.
- Verification files use a private storage key in the schema, never a public URL. Serve them through an authenticated, expiring download endpoint.
- Totals are recalculated on the server from the current menu catalog. The frontend is presentation only.
- `zod` validates request shapes at the API boundary. Add authentication and a rate limiter before exposing the API publicly.
- Precise rider coordinates are limited to an active delivery. Add retention/cleanup jobs for old location points.
- Secrets belong in environment variables. `.env.example` documents the required integrations and `.gitignore` prevents local secrets from being committed.

## Incremental build plan

### Phase 1 — current repository milestone

- Responsive Haatly customer journey: discovery, search, business menu, basket, checkout, COD/UPI/card selection, order timeline and demo live map.
- Seeded businesses for home kitchens, dhabas, bakery, chai, grocery and veg café.
- Merchant, delivery partner and admin workspaces to validate role-specific workflows.
- Express API for health, discovery, server-calculated orders, status updates, active delivery coordinates and admin summary.
- Prisma schema, environment contract and PWA shell.

### Phase 2 — connect durable services

- Add session/OTP authentication and a policy middleware for `CUSTOMER`, `MERCHANT`, `RIDER`, and `ADMIN`.
- Replace the in-memory repository with Prisma repositories and migrations.
- Add PostGIS or a geospatial service for radius and route calculations.
- Add Mapbox/OSM routing, Socket.IO/WebSocket events, FCM notifications and Razorpay webhooks.

### Phase 3 — marketplace operations

- Merchant onboarding and document review with private object storage.
- Rider onboarding, vehicle verification and dispatch offers with expiry.
- Coupons, reviews, support tickets, refunds, moderation and analytics jobs.
- Hindi locale files and an i18n provider so user-facing copy is not hardcoded in components.

### Phase 4 — rural resilience

- Image variants, CDN transforms, route-level code splitting and API caching.
- Offline queue for safe customer actions, retryable status reads and install prompts.
- Landmark-first address UX and service-area geofencing across multiple villages.

## Local development

```bash
npm install
npm run dev
```

The web app is served on port `5173` and the API on port `4000`. `npm run build` runs TypeScript checks and creates the production web bundle. After configuring `DATABASE_URL`, use `npm run db:generate` and `npm run db:validate` when the Prisma engine is available in your environment.
