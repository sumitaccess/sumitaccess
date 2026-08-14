'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

function distinct(values) {
  return Array.from(new Set(values)).sort();
}

function filterOptions() {
  const props = db.listProperties();
  return {
    cities: distinct(props.map((p) => p.city)),
    states: distinct(props.map((p) => p.state))
  };
}

/* ----------------------------- Home ----------------------------- */

router.get('/', (req, res) => {
  const stats = db.getStats();
  const featured = db.listProperties({ type: 'all' }).filter((p) => p.featured).slice(0, 6);
  const developers = db.listDevelopers().slice(0, 6);
  const posts = db.listPosts().slice(0, 3);
  res.render('home', {
    title: 'Bhoomi Trust — Land you can trust. Verified before you buy.',
    stats,
    featured,
    developers,
    posts
  });
});

/* ----------------------------- Category listings ----------------------------- */

const CATEGORIES = {
  'buy-plot': { type: 'plot', title: 'Buy Verified Plots', blurb: 'Legally verified residential plots from India’s most trusted developers — RERA and DTCP approved with clear titles.' },
  'buy-flat': { type: 'flat', title: 'Buy Flats & Apartments', blurb: 'RERA-registered apartments with occupation certificates and bank-loan eligibility across prime Indian cities.' },
  villas: { type: 'villa', title: 'Luxury Villas', blurb: 'Independent villas and row houses with private gardens and pools, fully verified and loan-ready.' },
  commercial: { type: 'commercial', title: 'Commercial Property', blurb: 'Grade-A offices and retail spaces in established business districts, with clear titles and approvals.' }
};

Object.entries(CATEGORIES).forEach(([slug, cfg]) => {
  router.get('/' + slug, (req, res) => {
    const properties = db.listProperties({ type: cfg.type });
    const opts = filterOptions();
    res.render('listing', {
      title: cfg.title + ' — Bhoomi Trust',
      category: cfg.type,
      heading: cfg.title,
      blurb: cfg.blurb,
      properties,
      cities: opts.cities,
      states: opts.states
    });
  });
});

/* ----------------------------- Developers ----------------------------- */

router.get('/developers', (req, res) => {
  const developers = db.listDevelopers().map((d) => ({
    ...d,
    propertyCount: db.listProperties({ developerId: d.id }).length
  }));
  res.render('developers', {
    title: 'Verified Developers — Bhoomi Trust',
    developers
  });
});

router.get('/developer/:id', (req, res) => {
  const d = db.getDeveloper(req.params.id);
  if (!d) return res.status(404).render('404', { title: 'Not found' });
  const properties = db.listProperties({ developerId: d.id });
  res.render('developer', {
    title: d.name + ' — Bhoomi Trust',
    developer: d,
    properties
  });
});

/* ----------------------------- About / Blog / Contact ----------------------------- */

router.get('/about', (req, res) => {
  res.render('about', { title: 'About — Bhoomi Trust' });
});

router.get('/blog', (req, res) => {
  res.render('blog', { title: 'Blog — Bhoomi Trust', posts: db.listPosts() });
});

router.get('/blog/:slug', (req, res) => {
  const post = db.getPost(req.params.slug);
  if (!post) return res.status(404).render('404', { title: 'Not found' });
  const related = db.listPosts().filter((p) => p.slug !== post.slug).slice(0, 3);
  res.render('post', { title: post.title + ' — Bhoomi Trust', post, related });
});

router.get('/contact', (req, res) => {
  const propertyId = req.query.property || null;
  const property = propertyId ? db.getProperty(propertyId) : null;
  res.render('contact', { title: 'Contact — Bhoomi Trust', property, propertyId });
});

/* ----------------------------- Auth pages ----------------------------- */

router.get('/login', (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Login — Bhoomi Trust' });
});

router.get('/register', (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Register — Bhoomi Trust' });
});

router.get('/dashboard', (req, res) => {
  const token = req.cookies ? req.cookies[auth.COOKIE_NAME] : null;
  const decoded = token ? auth.verifyToken(token) : null;
  if (!decoded || !decoded.id) return res.redirect('/login');
  const user = db.getUser(decoded.id);
  if (!user) return res.redirect('/login');
  const saved = db.getSaved(user.id);
  const enquiries = db.listEnquiries().filter((e) => e.email === user.email);
  res.render('dashboard', {
    title: 'My Account — Bhoomi Trust',
    user: { id: user.id, name: user.name, email: user.email },
    saved,
    enquiries
  });
});

/* ----------------------------- 404 ----------------------------- */

router.get('/404', (req, res) => res.status(404).render('404', { title: 'Not found' }));

module.exports = router;
