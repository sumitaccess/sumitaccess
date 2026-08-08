# ============================================================================
# SkillSwap — one-click deploy on Render.com
# ============================================================================

## Option A — Render Blueprint (recommended)

The repository ships a `render.yaml` blueprint. Deploying with it requires no
manual configuration:

1. Push this repo to your GitHub account.
2. On [render.com](https://render.com), sign up / sign in.
3. Dashboard → **New** → **Blueprint**.
4. Connect the GitHub repo → Render reads `render.yaml` and creates the web service.
5. Click **Apply** → Render builds (`npm install && npm run build`) and starts it.

The app is **self-initialising**: on first boot it applies the database schema
and seeds the demo data automatically, so there are no setup steps.

## Option B — Manual web service

1. Dashboard → **New** → **Web Service** → connect the repo.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Health check path:** `/healthz`
   - **Node version:** `22.14.0` (required for `node:sqlite`)
3. Environment variables:

   | Key | Value |
   |---|---|
   | `AUTH_TRUST_HOST` | `true` |
   | `NEXTAUTH_SECRET` | (generate a random string) |
   | `DEMO_PASSWORD` | `demo1234` |
   | `ADMIN_PASSWORD` | `admin1234` |
   | `RESEND_API_KEY` | *(optional — real OTP/password-reset emails; leave unset to use the dev email sink that logs to the service logs)* |

4. Deploy → open `https://<your-app>.onrender.com`

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Demo member | `demo@skillswap.app` | `demo1234` |
| Admin | `admin@skillswap.app` | `admin1234` |
| Community members | `firstname@example.com` | `skillswap123` |

## Notes & limitations

- **Database:** the runtime uses SQLite (`file:./dev.db`), which on Render's
  free tier is **ephemeral** — data resets whenever the service restarts or
  redeploys (the demo seed runs again automatically). For persistent data,
  add a Render PostgreSQL (or Neon/Supabase) instance and adapt the schema —
  the canonical PostgreSQL schema is in `prisma/schema.prisma`, and the SQL
  is written to be portable.
- **Emails:** without `RESEND_API_KEY`, OTP codes and password-reset links are
  logged to the service logs (Render → your service → **Logs**) rather than
  delivered. Registration requires the OTP, so for a live demo either set
  `RESEND_API_KEY` or grab the code from the logs.
- **Uploads/avatars:** stored on the local disk — also ephemeral on Render
  free; swap in Cloudinary/S3 for production.
- **Auth:** `AUTH_TRUST_HOST=true` + unset `NEXTAUTH_URL` makes Auth.js use
  your `*.onrender.com` domain automatically (works behind Render's proxy).
