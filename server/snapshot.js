'use strict';

/**
 * Build self-contained offline HTML snapshots of the site.
 * CSS is inlined into <style> and every image is embedded as a base64 data URI,
 * so the output files open in any browser with zero server and zero network.
 *
 * Run: node server/snapshot.js
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const db = require('./db');

const ROOT = path.join(__dirname, '..');
const VIEWS = path.join(ROOT, 'views');
const PUBLIC = path.join(ROOT, 'public');

const helpers = {
  year: new Date().getFullYear(),
  formatPrice: (n) => '₹' + Number(n || 0).toLocaleString('en-IN'),
  formatCompact: (n) => {
    const x = Number(n || 0);
    if (x >= 1e7) return (x / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    if (x >= 1e5) return (x / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
    return x.toLocaleString('en-IN');
  }
};

const inlineJS = `(function(){
  function animate(el){var t=parseFloat(el.dataset.count)||0;var s=el.dataset.suffix||'';var d=1500;var st=performance.now();(function tick(n){var p=Math.min((n-st)/d,1);var e=1-Math.pow(1-p,3);el.textContent=Math.round(t*e).toLocaleString('en-IN')+s;if(p<1)requestAnimationFrame(tick);else el.textContent=t.toLocaleString('en-IN')+s;})(performance.now());}
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){animate(en.target);io.unobserve(en.target);}});},{threshold:0.4});document.querySelectorAll('.stat-num').forEach(function(c){io.observe(c);});}else{document.querySelectorAll('.stat-num').forEach(animate);}
  var t=document.getElementById('navToggle'),m=document.getElementById('navMenu');
  if(t&&m){t.addEventListener('click',function(){var o=m.classList.toggle('open');t.setAttribute('aria-expanded',o);});m.addEventListener('click',function(e){if(e.target.tagName==='A'){m.classList.remove('open');t.setAttribute('aria-expanded',false);}});}
  var h=document.getElementById('siteHeader');if(h){var sc=function(){h.classList.toggle('scrolled',window.scrollY>12);};window.addEventListener('scroll',sc);sc();}
  document.addEventListener('click',function(e){var b=e.target.closest('.save-btn');if(b){e.preventDefault();alert('This is a static snapshot — connect the live site to save properties.');}});
  var ef=document.getElementById('enquiryForm');if(ef){ef.addEventListener('submit',function(e){e.preventDefault();alert('This is a static snapshot — connect the live site to submit enquiries.');});}
})();`;

function base64Image(name) {
  const p = path.join(PUBLIC, 'images', name);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  const mime = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

function inlineAssets(html) {
  // Inline CSS
  const css = fs.readFileSync(path.join(PUBLIC, 'css', 'styles.css'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="/css/styles.css" />', '<style>\n' + css + '\n</style>');

  // Inline JS (static, lively demo)
  html = html.replace('<script src="/js/app.js"></script>', '<script>\n' + inlineJS + '\n</script>');

  // Inline images (src= and background-image url())
  const names = new Set();
  const re = /\/images\/([A-Za-z0-9_.\-]+\.(?:jpg|jpeg|png|webp|gif))/g;
  let mm;
  while ((mm = re.exec(html)) !== null) names.add(mm[1]);
  const map = {};
  names.forEach((n) => { const d = base64Image(n); if (d) map[n] = d; });
  html = html.replace(re, (full, n) => (map[n] ? map[n] : full));

  return html;
}

async function render(name, data) {
  const tpl = path.join(VIEWS, name + '.ejs');
  return ejs.renderFile(tpl, Object.assign({}, helpers, data), { root: VIEWS });
}

async function main() {
  db.load();

  // Homepage
  const home = await render('home', {
    title: 'Bhoomi Trust — Land you can trust. Verified before you buy.',
    activeNav: 'home',
    user: null,
    stats: db.getStats(),
    featured: db.listProperties({ type: 'all' }).filter((p) => p.featured).slice(0, 6),
    developers: db.listDevelopers().slice(0, 6),
    posts: db.listPosts().slice(0, 3)
  });
  fs.writeFileSync(path.join(PUBLIC, 'snapshot.html'), inlineAssets(home));
  console.log('Wrote public/snapshot.html');

  // Buy Plot listing
  const opts = (() => {
    const props = db.listProperties();
    return {
      cities: Array.from(new Set(props.map((p) => p.city))).sort(),
      states: Array.from(new Set(props.map((p) => p.state))).sort()
    };
  })();
  const listing = await render('listing', {
    title: 'Buy Verified Plots — Bhoomi Trust',
    activeNav: 'plot',
    user: null,
    category: 'plot',
    heading: 'Buy Verified Plots',
    blurb: 'Legally verified residential plots from India’s most trusted developers — RERA and DTCP approved with clear titles.',
    properties: db.listProperties({ type: 'plot' }),
    cities: opts.cities,
    states: opts.states
  });
  fs.writeFileSync(path.join(PUBLIC, 'snapshot-buy-plot.html'), inlineAssets(listing));
  console.log('Wrote public/snapshot-buy-plot.html');
}

main().catch((e) => { console.error(e); process.exit(1); });
