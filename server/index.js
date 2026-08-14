'use strict';

const express = require('express');
const path = require('path');
const db = require('./db');
const auth = require('./auth');
const apiRouter = require('./routes/api');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

/* ----------------------------- Setup ----------------------------- */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Lightweight cookie parser (no external dependency)
app.use((req, res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) {
    raw.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > -1) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        try {
          req.cookies[k] = decodeURIComponent(v);
        } catch (e) {
          req.cookies[k] = v;
        }
      }
    });
  }
  next();
});

// Expose the current user to every view + request
app.use((req, res, next) => {
  const token = req.cookies[auth.COOKIE_NAME];
  const decoded = token ? auth.verifyToken(token) : null;
  const user = decoded && decoded.id ? db.getUser(decoded.id) : null;
  res.locals.user = user ? { id: user.id, name: user.name, email: user.email } : null;
  next();
});

// Resolve active nav item from the request path
app.use((req, res, next) => {
  const p = req.path;
  let nav = 'home';
  if (p.startsWith('/buy-plot')) nav = 'plot';
  else if (p.startsWith('/buy-flat')) nav = 'flat';
  else if (p.startsWith('/villas')) nav = 'villa';
  else if (p.startsWith('/commercial')) nav = 'commercial';
  else if (p.startsWith('/developers') || p.startsWith('/developer')) nav = 'developers';
  else if (p.startsWith('/about')) nav = 'about';
  else if (p.startsWith('/blog')) nav = 'blog';
  else if (p.startsWith('/contact')) nav = 'contact';
  res.locals.activeNav = nav;
  next();
});

// Shared view helpers
app.locals.formatPrice = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
app.locals.formatCompact = (n) => {
  const num = Number(n || 0);
  if (num >= 1e7) return (num / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (num >= 1e5) return (num / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
  return num.toLocaleString('en-IN');
};
app.locals.year = new Date().getFullYear();

// Make the cookie helper available to routes that need it
app.use((req, res, next) => {
  res.cookie = function (name, value, options) {
    const opts = options || {};
    let cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${opts.maxAge ? Math.floor(opts.maxAge / 1000) : 86400}`;
    if (opts.httpOnly) cookie += '; HttpOnly';
    if (opts.secure) cookie += '; Secure';
    if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;
    res.setHeader('Set-Cookie', cookie);
    return res;
  };
  res.clearCookie = function (name) {
    res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly`);
    return res;
  };
  next();
});

/* ----------------------------- Routes ----------------------------- */

app.get('/healthz', (req, res) => res.json({ ok: true, time: Date.now() }));

app.use('/api', apiRouter);
app.use('/', pagesRouter);

// Catch-all 404
app.use((req, res) => {
  if (res.headersSent) return;
  res.status(404).render('404', { title: 'Page not found — Bhoomi Trust' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
  res.status(500).render('404', { title: 'Something went wrong — Bhoomi Trust' });
});

/* ----------------------------- Start ----------------------------- */

if (require.main === module) {
  db.load();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bhoomi Trust running at http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
