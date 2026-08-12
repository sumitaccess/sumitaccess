# Deluxe Saloon (homage)

Ambient street-corner radio inspired by [deluxesalon.in](https://deluxesalon.in/) — cassette-era Hindi film songs, four India-time rotations, installable as a PWA.

Open `public/` with any static server.

## Deploy on [Render](https://render.com)

This is a **static site**. Files in `public/` are already production-ready (no `npm build`).

### Dashboard (easiest)

1. Sign in at [dashboard.render.com](https://dashboard.render.com) with GitHub.
2. **New → Static Site**.
3. Connect the repo `sumitaccess/sumitaccess`.
4. Fill in:
   - **Branch:** `arena/019ff45d-sumitaccess` (or `main` after you merge)
   - **Build Command:** `echo "static site, no build"`
   - **Publish Directory:** `public`
5. Click **Create Static Site**.

Render gives you HTTPS at `https://<name>.onrender.com` and redeploys on every push to that branch.

### Blueprint (`render.yaml`)

This repo already includes `render.yaml`.

1. Dashboard → **Blueprints → New Blueprint Instance**
2. Select this repository
3. Apply the blueprint — it creates the static site named `deluxe-saloon`

### Custom domain

Site → **Settings → Custom Domains** → add e.g. `radio.yourdomain.com` → point a CNAME at the `onrender.com` hostname Render shows you. TLS is automatic.

Do **not** create a Web Service / Python server for this project. Static Site is free, on a CDN, and matches how the app is built.
