'use strict';

/**
 * Bhoomi Trust — pure-JS, zero-dependency, file-backed data store.
 *
 * Why not SQLite? This sandbox cannot compile native addons (no network to
 * fetch Node headers), so we use a small JSON-file store with atomic writes.
 * It is fully self-contained and guaranteed to run with zero native deps.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let cache = null;
let writeChain = Promise.resolve();

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function buildSeed() {
  const developers = [
    { id: 1, name: 'Lodha Group', city: 'Mumbai', state: 'Maharashtra', since: 1980, rating: 4.8, logo: 'LG', blurb: 'India’s largest real estate developer, renowned for luxury townships and verified clear-title land.', properties: 480 },
    { id: 2, name: 'DLF', city: 'Gurugram', state: 'Haryana', since: 1946, rating: 4.7, logo: 'DL', blurb: 'Pioneers of planned urban communities across North India with RERA-compliant plotted developments.', properties: 410 },
    { id: 3, name: 'Godrej Properties', city: 'Mumbai', state: 'Maharashtra', since: 1990, rating: 4.6, logo: 'GP', blurb: 'Award-winning developer bringing world-class design and legal rigour to residential plots.', properties: 320 },
    { id: 4, name: 'Prestige Group', city: 'Bengaluru', state: 'Karnataka', since: 1986, rating: 4.7, logo: 'PG', blurb: 'South India’s most trusted name for gated communities and premium plotted layouts.', properties: 360 },
    { id: 5, name: 'Sobha Limited', city: 'Bengaluru', state: 'Karnataka', since: 1995, rating: 4.9, logo: 'SB', blurb: 'Backward-integrated developer famous for uncompromising quality and clear documentation.', properties: 210 },
    { id: 6, name: 'Brigade Group', city: 'Bengaluru', state: 'Karnataka', since: 1986, rating: 4.6, logo: 'BR', blurb: 'Builders of landmark integrated enclaves with DTCP and RERA approved land parcels.', properties: 240 },
    { id: 7, name: 'Mahindra Lifespaces', city: 'Mumbai', state: 'Maharashtra', since: 1994, rating: 4.5, logo: 'ML', blurb: 'Sustainable, future-ready plotted developments with transparent legal verification.', properties: 180 },
    { id: 8, name: 'Tata Housing', city: 'Mumbai', state: 'Maharashtra', since: 1984, rating: 4.7, logo: 'TH', blurb: 'A name synonymous with trust, delivering bank-loan-eligible verified residential plots.', properties: 160 }
  ];

  const img = {
    plot: ['/images/cat-plot.jpg', '/images/hero-aerial.jpg'],
    flat: ['/images/cat-flat.jpg', '/images/interior.jpg'],
    villa: ['/images/cat-villa.jpg', '/images/interior.jpg'],
    commercial: ['/images/cat-commercial.jpg', '/images/amenities.jpg']
  };

  const base = [
    // ----- PLOTS -----
    { type: 'plot', title: 'Lodha Reserve Plots — Palava', developerId: 1, city: 'Palava', state: 'Maharashtra', location: 'Near Dombivli, Mumbai region', price: 18500000, area: 2400, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-PR-12345', approvals: ['RERA', 'DTCP', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', '24x7 Security', 'Landscaped Avenues', 'Clubhouse Access', 'Underground Cabling'], description: 'Premium NA plots in a 2000-acre smart city with world-class infrastructure and clear, loan-eligible titles.', featured: true, status: 'available' },
    { type: 'plot', title: 'DLF Garden City Plots — Gurugram', developerId: 2, city: 'Gurugram', state: 'Haryana', location: 'Sector 91, Gurugram', price: 22500000, area: 3000, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-HR-5678', approvals: ['RERA', 'HUDA', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Wide Roads', 'Parks', 'Power Backup', 'Sewage Treatment'], description: 'RERA-approved freehold plots in a meticulously planned township by DLF with green boulevards.', featured: true, status: 'available' },
    { type: 'plot', title: 'Godrej Plots — Hosur Road', developerId: 3, city: 'Bengaluru', state: 'Karnataka', location: 'Off Hosur Road', price: 14200000, area: 1500, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-KA-9981', approvals: ['RERA', 'BDA', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Clubhouse', 'Jogging Track', 'CCTV', 'Rainwater Harvesting'], description: 'Verified residential plots by Godrej with clear titles and easy home-loan approvals.', featured: false, status: 'available' },
    { type: 'plot', title: 'Prestige Green Gables Plots', developerId: 4, city: 'Bengaluru', state: 'Karnataka', location: 'Devanahalli', price: 16800000, area: 2000, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-KA-7741', approvals: ['RERA', 'BDA', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Lake View', 'Clubhouse', 'Sports Court', 'Sewage Treatment'], description: 'Sprawling plotted development near the airport with panoramic lake views and verified documentation.', featured: false, status: 'available' },
    { type: 'plot', title: 'Sobha Plots — Whitefield', developerId: 5, city: 'Bengaluru', state: 'Karnataka', location: 'Whitefield', price: 19500000, area: 1800, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-KA-6610', approvals: ['RERA', 'BDA', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Smart Metering', 'Clubhouse', 'CCTV', 'Landscaped Gardens'], description: 'Sobha-quality plotted layouts in the IT corridor with uncompromised legal clarity.', featured: true, status: 'available' },
    { type: 'plot', title: 'Brigade Orchards Plots', developerId: 6, city: 'Devanahalli', state: 'Karnataka', location: 'Devanahalli', price: 15600000, area: 2200, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-KA-5502', approvals: ['RERA', 'BDA', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Orchard Views', 'Clubhouse', 'School Zone', 'Power Backup'], description: 'Plots within a self-contained orchard township with schools, retail and verified titles.', featured: false, status: 'available' },
    { type: 'plot', title: 'Mahindra Bloomdale Plots', developerId: 7, city: 'Chennai', state: 'Tamil Nadu', location: 'Oragadam', price: 11900000, area: 1600, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-TN-3310', approvals: ['RERA', 'DTCP', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Clubhouse', 'Parks', 'CCTV', 'Rainwater Harvesting'], description: 'Sustainable plotted development by Mahindra with transparent, loan-ready documentation.', featured: false, status: 'available' },
    { type: 'plot', title: 'Tata Swaram Plots — Boisar', developerId: 8, city: 'Boisar', state: 'Maharashtra', location: 'Boisar, Mumbai region', price: 9800000, area: 2000, areaUnit: 'sq.yd', bedrooms: 0, bathrooms: 0, rera: 'RERA-MH-2204', approvals: ['RERA', 'MIDC', 'Clear Title', 'Bank Loan'], amenities: ['Gated Community', 'Green Zones', 'Clubhouse', 'CCTV', 'Power Backup'], description: 'Affordable, fully verified plots in a large integrated township by Tata Housing.', featured: false, status: 'available' },

    // ----- FLATS -----
    { type: 'flat', title: 'Lodha Bellissimo — 3 BHK', developerId: 1, city: 'Mumbai', state: 'Maharashtra', location: 'Worli, Mumbai', price: 68500000, area: 2150, areaUnit: 'sq.ft', bedrooms: 3, bathrooms: 3, rera: 'RERA-PR-33210', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Sea View', 'Infinity Pool', 'Concierge', 'Gym', 'Smart Homes'], description: 'Sky-high 3 BHK apartments with Arabian Sea views and resort-class amenities.', featured: true, status: 'available' },
    { type: 'flat', title: 'DLF Camellias — 4 BHK', developerId: 2, city: 'Gurugram', state: 'Haryana', location: 'Golf Course Road', price: 92500000, area: 5200, areaUnit: 'sq.ft', bedrooms: 4, bathrooms: 5, rera: 'RERA-HR-1180', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Golf View', 'Private Lift', 'Spa', 'Valet', 'Cinema'], description: 'Ultra-luxury residences on Golf Course Road with private elevators and bespoke services.', featured: true, status: 'available' },
    { type: 'flat', title: 'Godrej Oceanside — 2 BHK', developerId: 3, city: 'Pune', state: 'Maharashtra', location: 'Kharadi', price: 9850000, area: 1180, areaUnit: 'sq.ft', bedrooms: 2, bathrooms: 2, rera: 'RERA-PN-4410', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Clubhouse', 'Pool', 'CCTV', 'Jogging Track', 'Power Backup'], description: 'Bright, well-planned 2 BHK homes for IT professionals with verified titles.', featured: false, status: 'available' },
    { type: 'flat', title: 'Prestige Lakeside Habitat — 3 BHK', developerId: 4, city: 'Bengaluru', state: 'Karnataka', location: 'Varthur', price: 14200000, area: 1720, areaUnit: 'sq.ft', bedrooms: 3, bathrooms: 3, rera: 'RERA-KA-8810', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Lake View', 'Pool', 'Clubhouse', 'Sports Court', 'CCTV'], description: 'Lake-facing 3 BHK apartments in a 12-acre gated community by Prestige.', featured: true, status: 'available' },
    { type: 'flat', title: 'Sobha Dream Acres — 2 BHK', developerId: 5, city: 'Bengaluru', state: 'Karnataka', location: 'Panathur', price: 8950000, area: 1050, areaUnit: 'sq.ft', bedrooms: 2, bathrooms: 2, rera: 'RERA-KA-7720', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Clubhouse', 'Pool', 'CCTV', 'Landscaped Gardens', 'Power Backup'], description: 'Quality-built 2 BHK homes by Sobha with clear, loan-eligible documentation.', featured: false, status: 'available' },
    { type: 'flat', title: 'Brigade Gateway — 3 BHK', developerId: 6, city: 'Bengaluru', state: 'Karnataka', location: 'Malleswaram', price: 18900000, area: 1980, areaUnit: 'sq.ft', bedrooms: 3, bathrooms: 3, rera: 'RERA-KA-6601', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Metro Connected', 'Mall', 'Hospital', 'Clubhouse', 'CCTV'], description: 'Integrated township living with mall, metro and hospital — all legally verified.', featured: false, status: 'available' },
    { type: 'flat', title: 'Mahindra Antheia — 3 BHK', developerId: 7, city: 'Pune', state: 'Maharashtra', location: 'Pimpri-Chinchwad', price: 11200000, area: 1450, areaUnit: 'sq.ft', bedrooms: 3, bathrooms: 3, rera: 'RERA-PN-3390', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Clubhouse', 'Pool', 'CCTV', 'Jogging Track', 'Power Backup'], description: 'Spacious 3 BHK homes in a green, well-connected Pune township.', featured: false, status: 'available' },
    { type: 'flat', title: 'Tata La Vida — 2 BHK', developerId: 8, city: 'Gurugram', state: 'Haryana', location: 'Sector 113', price: 9650000, area: 1250, areaUnit: 'sq.ft', bedrooms: 2, bathrooms: 2, rera: 'RERA-HR-2270', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Clubhouse', 'Pool', 'CCTV', 'Landscaped Gardens', 'Power Backup'], description: 'Thoughtfully designed 2 BHK homes by Tata with transparent documentation.', featured: false, status: 'available' },

    // ----- VILLAS -----
    { type: 'villa', title: 'Lodha Villa Royale', developerId: 1, city: 'Mumbai', state: 'Maharashtra', location: 'Palava', price: 142000000, area: 4200, areaUnit: 'sq.ft', bedrooms: 5, bathrooms: 6, rera: 'RERA-PR-55120', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Private Pool', 'Home Theatre', 'Smart Homes', 'Servant Quarter', 'Landscaped Garden'], description: 'Independent villas with private pools and concierge service in a flagship township.', featured: true, status: 'available' },
    { type: 'villa', title: 'DLF Aralias Villas', developerId: 2, city: 'Gurugram', state: 'Haryana', location: 'DLF Phase 5', price: 185000000, area: 6000, areaUnit: 'sq.ft', bedrooms: 5, bathrooms: 6, rera: 'RERA-HR-1140', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Golf View', 'Private Garden', 'Smart Homes', 'Spa', 'CCTV'], description: 'Low-density luxury villas on the exclusive DLF Golf Links.', featured: false, status: 'available' },
    { type: 'villa', title: 'Prestige Aspen Greens', developerId: 4, city: 'Bengaluru', state: 'Karnataka', location: 'Electronic City', price: 96000000, area: 3800, areaUnit: 'sq.ft', bedrooms: 4, bathrooms: 5, rera: 'RERA-KA-8850', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Private Garden', 'Clubhouse', 'CCTV', 'Sports Court', 'Power Backup'], description: 'Contemporary 4 BHK villas with private gardens in a secure gated enclave.', featured: true, status: 'available' },
    { type: 'villa', title: 'Sobha Villa Retreat', developerId: 5, city: 'Bengaluru', state: 'Karnataka', location: 'Sarjapur', price: 112000000, area: 4100, areaUnit: 'sq.ft', bedrooms: 4, bathrooms: 5, rera: 'RERA-KA-7790', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Private Pool', 'Home Office', 'CCTV', 'Landscaped Garden', 'Smart Homes'], description: 'Crafted villas by Sobha with private pools and meticulous finishing.', featured: false, status: 'available' },
    { type: 'villa', title: 'Brigade Woods Villas', developerId: 6, city: 'Bengaluru', state: 'Karnataka', location: 'Whitefield', price: 88000000, area: 3500, areaUnit: 'sq.ft', bedrooms: 4, bathrooms: 4, rera: 'RERA-KA-6640', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Private Garden', 'Clubhouse', 'CCTV', 'Jogging Track', 'Power Backup'], description: 'Tranquil villas nestled in a wooded, secure township.', featured: false, status: 'available' },
    { type: 'villa', title: 'Mahindra Eden Villas', developerId: 7, city: 'Chennai', state: 'Tamil Nadu', location: 'Mahindra World City', price: 74000000, area: 3200, areaUnit: 'sq.ft', bedrooms: 4, bathrooms: 4, rera: 'RERA-TN-3360', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Private Garden', 'Clubhouse', 'CCTV', 'Rainwater Harvesting', 'Power Backup'], description: 'Eco-conscious villas within a sustainable integrated city.', featured: false, status: 'available' },

    // ----- COMMERCIAL -----
    { type: 'commercial', title: 'Lodha Commercial Tower', developerId: 1, city: 'Mumbai', state: 'Maharashtra', location: 'Lower Parel', price: 245000000, area: 12000, areaUnit: 'sq.ft', bedrooms: 0, bathrooms: 4, rera: 'RERA-PR-77120', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Grade A Office', 'Central AC', '24x7 Access', 'Cafeteria', 'CCTV'], description: 'Premium Grade-A commercial office space in Mumbai’s business district.', featured: true, status: 'available' },
    { type: 'commercial', title: 'DLF Cyber City Block', developerId: 2, city: 'Gurugram', state: 'Haryana', location: 'Cyber City', price: 198000000, area: 9800, areaUnit: 'sq.ft', bedrooms: 0, bathrooms: 3, rera: 'RERA-HR-1190', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Grade A Office', 'Metro Connected', 'Food Court', 'CCTV', 'Power Backup'], description: 'Prestigious commercial offices in the heart of Gurugram’s Cyber City.', featured: false, status: 'available' },
    { type: 'commercial', title: 'Prestige Tech Park', developerId: 4, city: 'Bengaluru', state: 'Karnataka', location: 'Marathahalli', price: 156000000, area: 8500, areaUnit: 'sq.ft', bedrooms: 0, bathrooms: 3, rera: 'RERA-KA-8870', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['IT Park', 'Central AC', 'Cafeteria', 'CCTV', 'Power Backup'], description: 'Plug-and-play commercial spaces in Bengaluru’s prime tech corridor.', featured: true, status: 'available' },
    { type: 'commercial', title: 'Brigade Business Park', developerId: 6, city: 'Bengaluru', state: 'Karnataka', location: 'JP Nagar', price: 132000000, area: 7200, areaUnit: 'sq.ft', bedrooms: 0, bathrooms: 3, rera: 'RERA-KA-6670', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Business Park', 'Central AC', 'Cafeteria', 'CCTV', 'Power Backup'], description: 'Well-located commercial offices with excellent connectivity.', featured: false, status: 'available' },
    { type: 'commercial', title: 'Godrej Commercial Hub', developerId: 3, city: 'Pune', state: 'Maharashtra', location: 'Wakad', price: 98000000, area: 6400, areaUnit: 'sq.ft', bedrooms: 0, bathrooms: 2, rera: 'RERA-PN-4450', approvals: ['RERA', 'OC Received', 'Clear Title', 'Bank Loan'], amenities: ['Retail + Office', 'Central AC', 'CCTV', 'Power Backup', 'Elevators'], description: 'Mixed-use commercial hub with retail and office spaces, fully verified.', featured: false, status: 'available' }
  ];

  const properties = base.map((p, i) => ({
    id: i + 1,
    slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    verified: true,
    images: img[p.type],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    ...p
  }));

  const posts = [
    { slug: 'why-verified-plots-matter', title: 'Why Verified Plots Matter More Than Ever', excerpt: 'How legal due diligence protects your biggest investment — and why Bhoomi Trust verifies before you buy.', cover: '/images/cat-plot.jpg', author: 'Bhoomi Trust Research', date: '2026-07-20', body: 'Buying land is the single largest investment most families make. Yet thousands of transactions every year are derailed by unclear titles, missing approvals, or RERA non-compliance. At Bhoomi Trust we verify every plot against RERA, DTCP and revenue records before it is ever listed. This article explains the documents you should insist on, the red flags to avoid, and how our verification layer gives you peace of mind from search to registry.' },
    { slug: 'rera-explained', title: 'RERA Explained: A Buyer’s Pocket Guide', excerpt: 'A plain-language guide to the Real Estate (Regulation and Development) Act and what it means for you.', cover: '/images/about.jpg', author: 'Bhoomi Trust Legal', date: '2026-06-28', body: 'The Real Estate (Regulation and Development) Act, 2016 transformed how projects are marketed and delivered in India. In this guide we break down carpet area, project registration numbers, escrow accounts and your rights as a home buyer — so you can shop for verified property with confidence.' },
    { slug: 'plot-vs-apartment', title: 'Plot vs Apartment: Which Should You Buy?', excerpt: 'The timeless debate, settled with a clear-eyed look at appreciation, flexibility and effort.', cover: '/images/cat-villa.jpg', author: 'Bhoomi Trust Advisory', date: '2026-05-15', body: 'Plots offer flexibility and often stronger long-term appreciation, while apartments deliver immediate livability and amenities. We weigh both across budget, intent and risk so you can choose the path that fits your goals — and how Bhoomi Trust supports either with verified inventory.' },
    { slug: 'nri-property-guide', title: 'An NRI’s Guide to Buying Verified Property in India', excerpt: 'Banking, taxation and Power of Attorney — the essentials for Non-Resident Indians.', cover: '/images/cat-commercial.jpg', author: 'Bhoomi Trust Global', date: '2026-04-02', body: 'Non-Resident Indians account for a growing share of Indian real estate demand. This guide covers FEMA rules, NRO/NRE accounts, TDS on purchase, and how a trusted advisor can manage verification and paperwork on your behalf while you are abroad.' }
  ];

  // Hash the demo password up-front so it matches the scrypt format used at runtime.
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoHash = crypto.scryptSync('demo1234', demoSalt, 64).toString('hex');

  const users = [
    { id: 1, name: 'Demo Buyer', email: 'demo@bhoomitrust.com', password: `${demoSalt}:${demoHash}`, saved: [], createdAt: new Date().toISOString() }
  ];

  const settings = {
    stats: { developers: 42, propertiesSold: 3240, states: 9, verified: 100 }
  };

  return {
    users,
    developers,
    properties,
    enquiries: [],
    posts,
    settings
  };
}

function load() {
  if (cache) return cache;
  ensureDir();
  if (fs.existsSync(STORE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    } catch (e) {
      cache = null;
    }
  }
  if (!cache || !cache.properties) {
    cache = buildSeed();
    persistSync();
  }
  for (const key of ['users', 'developers', 'properties', 'enquiries', 'posts', 'settings']) {
    if (!cache[key]) cache[key] = key === 'settings' ? {} : [];
  }
  return cache;
}

function persistSync() {
  ensureDir();
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

function save() {
  writeChain = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        ensureDir();
        const tmp = STORE_FILE + '.tmp';
        fs.writeFile(tmp, JSON.stringify(cache, null, 2), (err) => {
          if (err) return reject(err);
          fs.rename(tmp, STORE_FILE, (e2) => (e2 ? reject(e2) : resolve()));
        });
      })
  );
  return writeChain;
}

function nextId(collection) {
  const items = cache[collection] || [];
  return items.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
}

/* ----------------------------- Query API ----------------------------- */

function getStats() {
  load();
  return cache.settings.stats;
}

function listProperties(filters = {}) {
  load();
  let items = cache.properties.slice();
  if (filters.type && filters.type !== 'all') items = items.filter((p) => p.type === filters.type);
  if (filters.verified === 'true' || filters.verified === true) items = items.filter((p) => p.verified);
  if (filters.developerId) items = items.filter((p) => p.developerId === Number(filters.developerId));
  if (filters.city) items = items.filter((p) => p.city.toLowerCase() === String(filters.city).toLowerCase());
  if (filters.state) items = items.filter((p) => p.state.toLowerCase() === String(filters.state).toLowerCase());
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }
  if (filters.minPrice) items = items.filter((p) => p.price >= Number(filters.minPrice));
  if (filters.maxPrice) items = items.filter((p) => p.price <= Number(filters.maxPrice));

  const sort = filters.sort || 'featured';
  if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'area-desc') items.sort((a, b) => b.area - a.area);
  else items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return items;
}

function getProperty(idOrSlug) {
  load();
  return cache.properties.find(
    (p) => p.id === Number(idOrSlug) || p.slug === String(idOrSlug)
  );
}

function listDevelopers() {
  load();
  return cache.developers.slice();
}

function getDeveloper(id) {
  load();
  return cache.developers.find((d) => d.id === Number(id));
}

function listPosts() {
  load();
  return cache.posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPost(slug) {
  load();
  return cache.posts.find((p) => p.slug === String(slug));
}

function createEnquiry(data) {
  load();
  const enquiry = {
    id: nextId('enquiries'),
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    propertyId: data.propertyId ? Number(data.propertyId) : null,
    message: data.message || '',
    createdAt: new Date().toISOString()
  };
  cache.enquiries.push(enquiry);
  save();
  return enquiry;
}

function listEnquiries() {
  load();
  return cache.enquiries.slice();
}

function findUserByEmail(email) {
  load();
  return cache.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function getUser(id) {
  load();
  return cache.users.find((u) => u.id === Number(id));
}

function createUser({ name, email, password }) {
  load();
  const user = {
    id: nextId('users'),
    name,
    email,
    password,
    saved: [],
    createdAt: new Date().toISOString()
  };
  cache.users.push(user);
  save();
  return user;
}

function toggleSaved(userId, propertyId) {
  load();
  const user = getUser(userId);
  if (!user) return null;
  const pid = Number(propertyId);
  user.saved = user.saved || [];
  const idx = user.saved.indexOf(pid);
  if (idx > -1) user.saved.splice(idx, 1);
  else user.saved.push(pid);
  save();
  return user.saved;
}

function getSaved(userId) {
  load();
  const user = getUser(userId);
  if (!user || !user.saved) return [];
  return user.saved.map((id) => getProperty(id)).filter(Boolean);
}

module.exports = {
  load,
  getStats,
  listProperties,
  getProperty,
  listDevelopers,
  getDeveloper,
  listPosts,
  getPost,
  createEnquiry,
  listEnquiries,
  findUserByEmail,
  getUser,
  createUser,
  toggleSaved,
  getSaved
};
