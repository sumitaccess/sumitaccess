'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email };
}

function withDeveloper(p) {
  if (!p) return p;
  const dev = db.getDeveloper(p.developerId);
  return { ...p, developerName: dev ? dev.name : 'Bhoomi Trust Verified', developerLogo: dev ? dev.logo : 'BT' };
}

/* ----------------------------- Auth ----------------------------- */

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (db.findUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const hash = await auth.hashPassword(password);
    const user = db.createUser({ name: String(name).trim(), email: String(email).trim(), password: hash });
    auth.setAuthCookie(res, { id: user.id, name: user.name, email: user.email });
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    console.error('register error', e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const ok = await auth.verifyPassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    auth.setAuthCookie(res, { id: user.id, name: user.name, email: user.email });
    res.json({ user: publicUser(user) });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/auth/logout', (req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/auth/me', (req, res) => {
  const token = req.cookies ? req.cookies[auth.COOKIE_NAME] : null;
  const decoded = token ? auth.verifyToken(token) : null;
  if (!decoded || !decoded.id) return res.json({ user: null });
  const user = db.getUser(decoded.id);
  res.json({ user: publicUser(user) });
});

/* ----------------------------- Properties ----------------------------- */

router.get('/properties', (req, res) => {
  try {
    const items = db.listProperties(req.query).map(withDeveloper);
    res.json({ properties: items, count: items.length });
  } catch (e) {
    console.error('properties error', e);
    res.status(500).json({ error: 'Failed to load properties.' });
  }
});

router.get('/properties/:id', (req, res) => {
  try {
    const p = db.getProperty(req.params.id);
    if (!p) return res.status(404).json({ error: 'Property not found.' });
    res.json({ property: withDeveloper(p) });
  } catch (e) {
    console.error('property error', e);
    res.status(500).json({ error: 'Failed to load property.' });
  }
});

/* ----------------------------- Developers ----------------------------- */

router.get('/developers', (req, res) => {
  try {
    const developers = db.listDevelopers().map((d) => ({
      ...d,
      propertyCount: db.listProperties({ developerId: d.id }).length
    }));
    res.json({ developers });
  } catch (e) {
    console.error('developers error', e);
    res.status(500).json({ error: 'Failed to load developers.' });
  }
});

router.get('/developers/:id', (req, res) => {
  try {
    const d = db.getDeveloper(req.params.id);
    if (!d) return res.status(404).json({ error: 'Developer not found.' });
    const properties = db.listProperties({ developerId: d.id }).map(withDeveloper);
    res.json({ developer: d, properties });
  } catch (e) {
    console.error('developer error', e);
    res.status(500).json({ error: 'Failed to load developer.' });
  }
});

/* ----------------------------- Blog ----------------------------- */

router.get('/blog', (req, res) => {
  try {
    res.json({ posts: db.listPosts() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load posts.' });
  }
});

router.get('/blog/:slug', (req, res) => {
  try {
    const post = db.getPost(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load post.' });
  }
});

/* ----------------------------- Enquiries ----------------------------- */

router.post('/enquiries', (req, res) => {
  try {
    const { name, email, phone, message, propertyId } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const enquiry = db.createEnquiry({ name, email, phone, message, propertyId });
    res.status(201).json({ ok: true, enquiry: { id: enquiry.id } });
  } catch (e) {
    console.error('enquiry error', e);
    res.status(500).json({ error: 'Failed to submit enquiry.' });
  }
});

/* ----------------------------- Stats ----------------------------- */

router.get('/stats', (req, res) => {
  res.json({ stats: db.getStats() });
});

/* ----------------------------- Saved (auth) ----------------------------- */

router.post('/saved', auth.requireAuth, (req, res) => {
  try {
    const { propertyId } = req.body || {};
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required.' });
    const saved = db.toggleSaved(req.user.id, propertyId);
    res.json({ saved });
  } catch (e) {
    console.error('saved error', e);
    res.status(500).json({ error: 'Failed to update saved list.' });
  }
});

router.get('/saved', auth.requireAuth, (req, res) => {
  try {
    const saved = db.getSaved(req.user.id).map(withDeveloper);
    res.json({ saved });
  } catch (e) {
    console.error('saved error', e);
    res.status(500).json({ error: 'Failed to load saved list.' });
  }
});

module.exports = router;
