/* ============================================================
   Bhoomi Trust — Frontend interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

  let toastTimer = null;
  function toast(msg, type) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 3200);
  }

  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    let data = {};
    try { data = await res.json(); } catch (e) { /* no body */ }
    return { ok: res.ok, status: res.status, data: data };
  }

  /* ---------- Mobile nav ---------- */
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  const header = $('#siteHeader');
  if (header) {
    const onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 12); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    }
    requestAnimationFrame(tick);
  }
  const counters = $all('.stat-num');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateCount(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { io.observe(c); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Saved properties ---------- */
  function isLoggedIn() { return !!$('#logoutBtn'); }

  async function syncSavedState() {
    if (!isLoggedIn()) return;
    try {
      const r = await api('/api/saved', { method: 'GET' });
      if (r.ok && Array.isArray(r.data.saved)) {
        const ids = r.data.saved.map(function (p) { return String(p.id); });
        $all('.save-btn').forEach(function (btn) {
          if (ids.indexOf(btn.getAttribute('data-id')) > -1) btn.classList.add('saved');
        });
      }
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.save-btn');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-id');
    if (!isLoggedIn()) {
      toast('Please login to save properties.', 'error');
      setTimeout(function () { window.location.href = '/login'; }, 900);
      return;
    }
    btn.disabled = true;
    api('/api/saved', {
      method: 'POST',
      body: JSON.stringify({ propertyId: id })
    }).then(function (r) {
      btn.disabled = false;
      if (r.ok) {
        const saved = r.data.saved || [];
        const nowSaved = saved.indexOf(Number(id)) > -1;
        btn.classList.toggle('saved', nowSaved);
        btn.textContent = nowSaved ? '♥' : '♡';
        toast(nowSaved ? 'Saved to your account.' : 'Removed from saved.');
      } else if (r.status === 401) {
        toast('Please login to save properties.', 'error');
        setTimeout(function () { window.location.href = '/login'; }, 900);
      } else {
        toast('Could not update saved list.', 'error');
      }
    }).catch(function () {
      btn.disabled = false;
      toast('Network error. Please try again.', 'error');
    });
  });

  /* ---------- Listing filters ---------- */
  const grid = $('#propertyGrid');
  const resultCount = $('#resultCount');
  const fSearch = $('#filterSearch');
  const fCity = $('#filterCity');
  const fBudget = $('#filterBudget');
  const fSort = $('#filterSort');

  function typeFromUrl() {
    const path = window.location.pathname;
    if (path.indexOf('/buy-plot') === 0) return 'plot';
    if (path.indexOf('/buy-flat') === 0) return 'flat';
    if (path.indexOf('/villas') === 0) return 'villa';
    if (path.indexOf('/commercial') === 0) return 'commercial';
    return 'all';
  }

  function propertyCardHTML(p) {
    const typeLabel = { plot: 'Plot', flat: 'Apartment', villa: 'Villa', commercial: 'Commercial' }[p.type] || p.type;
    const beds = p.bedrooms ? ' · ' + p.bedrooms + ' BHK' : '';
    const img = (p.images && p.images[0]) ? p.images[0] : '/images/hero-aerial.jpg';
    return '' +
      '<article class="card property-card" data-type="' + escapeHtml(p.type) + '">' +
        '<a class="card-media" href="/contact?property=' + encodeURIComponent(p.id) + '" aria-label="Enquire about ' + escapeHtml(p.title) + '">' +
          '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(p.title) + '" loading="lazy" />' +
          '<span class="badge badge-verified">✓ Verified</span>' +
          '<span class="badge badge-type">' + escapeHtml(typeLabel) + '</span>' +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-loc">' + escapeHtml(p.city) + ', ' + escapeHtml(p.state) + '</div>' +
          '<h3 class="card-title">' + escapeHtml(p.title) + '</h3>' +
          '<div class="card-meta"><span>' + Number(p.area).toLocaleString('en-IN') + ' ' + escapeHtml(p.areaUnit) + '</span>' + beds + '<span>· ' + escapeHtml(p.developerName) + '</span></div>' +
          '<div class="card-price">' + formatPrice(p.price) + '</div>' +
          '<div class="card-actions">' +
            '<a class="btn btn-outline btn-sm" href="/contact?property=' + encodeURIComponent(p.id) + '">Enquire</a>' +
            '<button class="save-btn" data-id="' + escapeHtml(p.id) + '" type="button" aria-label="Save property" title="Save">♡</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  let filterTimer = null;
  async function loadProperties() {
    if (!grid) return;
    const params = new URLSearchParams();
    params.set('type', typeFromUrl());
    if (fSearch && fSearch.value.trim()) params.set('search', fSearch.value.trim());
    if (fCity && fCity.value) params.set('city', fCity.value);
    if (fBudget && fBudget.value) params.set('maxPrice', fBudget.value);
    if (fSort && fSort.value) params.set('sort', fSort.value);

    try {
      const r = await api('/api/properties?' + params.toString(), { method: 'GET' });
      if (!r.ok) return;
      const items = r.data.properties || [];
      if (items.length === 0) {
        grid.innerHTML = '<p class="empty">No properties match your filters yet.</p>';
      } else {
        grid.innerHTML = items.map(propertyCardHTML).join('');
      }
      if (resultCount) resultCount.textContent = items.length + ' verified properties';
      await syncSavedState();
      window.scrollTo({ top: grid.offsetTop - 90, behavior: 'smooth' });
    } catch (e) {
      /* keep server-rendered content on failure */
    }
  }

  if (grid) {
    [fSearch, fCity, fBudget, fSort].forEach(function (el) {
      if (!el) return;
      const evt = (el === fSearch) ? 'input' : 'change';
      el.addEventListener(evt, function () {
        if (el === fSearch) {
          clearTimeout(filterTimer);
          filterTimer = setTimeout(loadProperties, 300);
        } else {
          loadProperties();
        }
      });
    });
  }

  /* ---------- Auth: login / register ---------- */
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const note = $('#formNote');
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      const r = await api('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email: email, password: password })
      });
      if (r.ok) {
        window.location.href = '/dashboard';
      } else {
        note.hidden = false; note.className = 'form-note err';
        note.textContent = (r.data && r.data.error) || 'Login failed.';
      }
    });
  }

  const registerForm = $('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const note = $('#formNote');
      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const r = await api('/api/auth/register', {
        method: 'POST', body: JSON.stringify({ name: name, email: email, password: password })
      });
      if (r.ok) {
        window.location.href = '/dashboard';
      } else {
        note.hidden = false; note.className = 'form-note err';
        note.textContent = (r.data && r.data.error) || 'Registration failed.';
      }
    });
  }

  const logoutBtns = $all('.js-logout');
  logoutBtns.forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      await api('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  });

  /* ---------- Enquiry form ---------- */
  const enquiryForm = $('#enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const note = $('#formNote');
      const payload = {
        name: enquiryForm.name.value.trim(),
        email: enquiryForm.email.value.trim(),
        phone: enquiryForm.phone ? enquiryForm.phone.value.trim() : '',
        message: enquiryForm.message.value.trim(),
        propertyId: enquiryForm.propertyId ? enquiryForm.propertyId.value : null
      };
      if (!payload.name || !payload.email || !payload.message) {
        note.hidden = false; note.className = 'form-note err';
        note.textContent = 'Please fill in your name, email and message.';
        return;
      }
      const r = await api('/api/enquiries', { method: 'POST', body: JSON.stringify(payload) });
      if (r.ok) {
        note.hidden = false; note.className = 'form-note ok';
        note.textContent = 'Thank you! A Bhoomi Trust advisor will contact you shortly.';
        enquiryForm.reset();
        toast('Enquiry submitted successfully.');
      } else {
        note.hidden = false; note.className = 'form-note err';
        note.textContent = (r.data && r.data.error) || 'Could not submit enquiry.';
      }
    });
  }

  /* ---------- Newsletter ---------- */
  const nlForm = $('#newsletterForm');
  if (nlForm) {
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const note = $('#newsletterNote');
      if (note) note.hidden = false;
      nlForm.reset();
    });
  }

  /* ---------- Init ---------- */
  syncSavedState();
})();
