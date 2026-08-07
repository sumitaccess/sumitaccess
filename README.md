# Bhoomi Trust — Premium Real Estate Marketplace

A complete, full‑stack website for **Bhoomi Trust**, a trusted Indian marketplace for
legally verified residential plots, apartments, villas and commercial properties.

Built with **Node.js + Express** (backend API + server‑rendered EJS pages) and a
**zero‑native‑dependency, file‑backed JSON database** so it runs anywhere with no
compilation step.

---

## ✨ Features

- **Premium UI/UX** — navy `#0A1A35` + gold `#C8A24A` design system, glassmorphism
  sticky nav, serif headings, smooth animations, fully responsive (mobile‑first).
- **Public pages** — Home (hero, animated stats, featured, verification steps,
  developers, blog, CTA), Buy Plot / Buy Flat / Villas / Commercial listings with
  **live filters** (search, city, budget, sort), Developers, Developer detail,
  About, Blog + articles, Contact.
- **User accounts** — register / login (JWT in http‑only cookie, scrypt password
  hashing), a personal dashboard with saved properties and enquiry history.
- **Backend API** — properties, developers, blog, enquiries, auth, stats and a
  saved‑properties toggle, all with validation and error handling.
- **Verification focus** — every listing is marked 100% verified (RERA / DTCP /
  Clear Title / Bank Loan Eligible).

## 🧱 Tech Stack

| Layer      | Choice                                            |
|------------|---------------------------------------------------|
| Runtime    | Node.js (>=18, tested on 22)                      |
| Server     | Express 4                                         |
| Views      | EJS (server‑side rendering)                       |
| Auth       | jsonwebtoken + Node `crypto` (scrypt)             |
| Database   | Pure‑JS JSON file store (`server/db.js`)          |
| Frontend   | Vanilla HTML/CSS/JS (no build step)              |

> **Why a JSON store instead of SQLite?** This environment cannot compile native
> addons (no network to fetch Node headers), so `better-sqlite3` fails to build.
> The included store is fully self‑contained, atomic, and zero‑dependency.

## 🚀 Run it

```bash
npm install
npm start
# open http://localhost:3000
```

For development with auto‑restart: `npm run dev` (uses `node --watch`).

To reset the data: `npm run seed`.

### Demo account
- Email: `demo@bhoomitrust.com`
- Password: `demo1234`

## 📡 API Reference

| Method | Endpoint                  | Auth | Description                       |
|--------|---------------------------|------|-----------------------------------|
| GET    | `/api/properties`         | –    | List properties (filters supported)|
| GET    | `/api/properties/:id`     | –    | Property detail (by id or slug)   |
| GET    | `/api/developers`         | –    | List developers                   |
| GET    | `/api/developers/:id`     | –    | Developer + their properties      |
| GET    | `/api/blog`               | –    | List blog posts                   |
| GET    | `/api/blog/:slug`         | –    | Single post                       |
| GET    | `/api/stats`              | –    | Marketing stats                   |
| POST   | `/api/auth/register`      | –    | Create account                    |
| POST   | `/api/auth/login`         | –    | Login (sets http‑only cookie)     |
| POST   | `/api/auth/logout`        | –    | Logout                            |
| GET    | `/api/auth/me`            | –    | Current user                      |
| POST   | `/api/enquiries`          | –    | Submit a contact enquiry          |
| GET    | `/api/saved`              | ✓    | List saved properties             |
| POST   | `/api/saved`              | ✓    | Toggle a saved property           |

Property list filters: `type` (plot|flat|villa|commercial), `city`, `state`,
`developerId`, `search`, `minPrice`, `maxPrice`, `sort`
(`featured`|`price-asc`|`price-desc`|`area-desc`).

## 📁 Project Structure

```
server/
  index.js           Express app, middleware, routing, error handling
  db.js              JSON file-backed data store + seed data
  seed.js            Reset/re-seed script
  auth.js           Password hashing, JWT, cookie helpers
  routes/
    api.js           JSON API
    pages.js         Server-rendered EJS pages
views/               EJS templates (layout partials + pages)
public/
  css/styles.css     Design system
  js/app.js          Frontend interactions
  images/            Generated premium imagery
data/store.json      Created at runtime (git-ignored)
```
