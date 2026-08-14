# Food-Delivery-Local

## Haatly — good things, closer home

Haatly is a mobile-first hyperlocal food, grocery and local delivery platform for a village and nearby rural areas. It connects customers with home kitchens, dhabas, bakeries, kirana stores and local delivery partners through one simple, original experience.

> **Current milestone:** a polished, runnable MVP foundation. It includes the core customer flow, role-specific workspaces, a real API boundary with server-side order calculations, a Prisma/PostgreSQL schema, PWA metadata and a staged production roadmap. Payment, OTP, maps and realtime providers are intentionally wired as integration boundaries rather than pretending to be live without credentials.

![Haatly local delivery experience](https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80)

## What is included

### Customer experience

- Mobile-first home page with an original Haatly identity
- Nearby restaurants, home kitchens, bakery, grocery and local shop discovery
- Search across businesses, cuisines and menu items
- Category browsing, favourites and a nearby-area map view
- Business detail pages with menus, veg/non-veg markers and add-to-basket actions
- Basket with quantities, delivery fee, platform fee, local offer and free-delivery threshold
- Landmark-friendly checkout with Home / Old water tank addresses
- Cash on delivery, UPI and card payment method architecture
- Order placement with server-side catalog price validation
- Order timeline, ETA, rider details and delivery route preview
- Order history and reorder flow
- Profile, notifications, privacy messaging and installable PWA shell

### Local operations workspaces

Use the profile screen to preview separate role experiences:

- **Merchant studio:** order queue, sales, rating, prep time, menu performance and customer attention list
- **Rider app:** online/offline state, delivery requests, earnings, route and navigation CTA
- **Operations console:** order metrics, live operations map, verification queue and recent orders

### Backend foundation

- Express API on port `4000`
- `zod` request validation
- Server-side order totals, minimum order and discount rules
- Order status history and active-delivery location privacy rules
- Business discovery/search endpoint
- Admin summary endpoint
- Prisma schema for PostgreSQL covering roles, businesses, verification documents, menus, orders, payments, refunds, assignments, location points, reviews, favourites, coupons, notifications, chat, support, pricing and audit logs
- Environment contract for database, maps, payments and push notifications

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. The API runs on `http://localhost:4000` and Vite proxies browser requests from `/api/*` to it.

Useful commands:

```bash
npm run build          # Type-check and build the web app
npm run dev:api       # API only
npm run dev:web       # Web only
npm run db:generate   # Generate Prisma client after configuring DATABASE_URL
npm run db:validate   # Validate the Prisma schema
```

Copy `.env.example` to `.env` before connecting real services. Never commit real secrets.

## Demo journey

1. Search for `chai`, `biryani` or `milk`.
2. Open a local business and add menu items.
3. Open the basket and continue to checkout.
4. Choose COD, UPI or card architecture and place the order.
5. Preview the order timeline and click **Preview next update** to see the delivery route progress.
6. Open **Profile → Haatly workspaces** to inspect merchant, rider and admin surfaces.

## API surface

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | API health and environment check |
| `GET /api/businesses?q=...` | Business and menu discovery |
| `GET /api/businesses/:businessId` | Business detail and menu |
| `POST /api/orders` | Validate and create an order |
| `GET /api/orders/:orderId` | Read an order |
| `PATCH /api/orders/:orderId/status` | Append a status transition in the local service |
| `POST /api/delivery/location` | Accept location only for an active delivery |
| `GET /api/delivery/location/:orderId` | Read active delivery location |
| `GET /api/admin/summary` | Operations metrics for the admin workspace |

The local API uses seeded in-memory data so the app starts without external credentials. `prisma/schema.prisma` is the durable production contract; the next backend step is replacing the in-memory repository with Prisma transactions.

## Architecture and production path

Read [docs/architecture.md](docs/architecture.md) for the request boundaries, order state flow, privacy/security decisions and phased implementation plan.

Recommended production services:

- **Frontend:** Vite build deployed to Vercel, Netlify or an equivalent CDN
- **API:** Node/Express service on a managed container or serverless-compatible host
- **Database:** managed PostgreSQL with Prisma migrations
- **Maps:** Mapbox or an OpenStreetMap-compatible routing provider
- **Realtime:** WebSocket / Socket.IO with Redis pub/sub
- **Payments:** Razorpay order + webhook flow; never store raw card data
- **Storage:** private object storage for business verification files and images
- **Notifications:** Firebase Cloud Messaging plus optional SMS/WhatsApp provider

## Principles

- Local businesses should be able to manage the platform from a phone.
- COD and landmark-based addresses are first-class, not afterthoughts.
- Only show businesses that can serve the customer’s area.
- Recalculate prices and delivery rules on the server.
- Stop precise rider tracking after an active delivery ends.
- Keep the visual system warm, readable, original and uncluttered.
- Build the customer → merchant → rider → admin loop before adding growth features.

## License

This project is an original product concept for local delivery. Add the project license before public production use.
