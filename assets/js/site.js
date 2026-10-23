/* Cejiroh shared script: nav, footer, contact form (with spam checks) */
const CONFIG = {
  // Your existing Google Apps Script web app (same URL: redeploy Code.gs as a new version)
  formUrl: 'https://script.google.com/macros/s/AKfycbzAUdVyJyXGCziUois9FB9lcGOz-6GsoTloTUdPnXvJ-YKqjkTX7aNTQnHTh0WLYqOm/exec',
  // Optional Cloudflare Turnstile site key. Leave '' to keep it off.
  turnstileSiteKey: '',
  email: 'cejiroh@gmail.com',
  minSeconds: 3
};
const MSG = {
  ok: 'Your message has been submitted.',
  fail: 'Your message has failed. Please try again or contact us at ' + CONFIG.email,
  fast: 'That was quick. Please check your message and send it again.',
  fields: 'Please fill in your name, a valid email and a message.'
};
const ICO = n => `<svg class="ico" aria-hidden="true"><use href="/assets/icons/sprite.svg#${n}"/></svg>`;
const NAV = [['3D', '/3d/'], ['Videos', '/videos/'], ['Website', '/website/'], ['Graphics', '/graphics/'], ['Products', '/products/']];
const here = location.pathname.replace(/index\.html$/, '');

/* nav */
const navEl = document.querySelector('[data-nav]');
if (navEl) {
  navEl.outerHTML = `<header class="nav"><div class="wrap">
    <a class="logo" href="/" aria-label="Cejiroh home"><img class="d" src="/assets/logo/logo-dark.svg" alt="Cejiroh" width="106" height="28"><img class="l" src="/assets/logo/logo-light.svg" alt="" width="106" height="28"></a>
    <ul class="links" id="links">${NAV.map(([t, h]) => `<li><a href="${h}"${here === h ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul>
    <a class="btn" href="${here === '/' ? '' : '/'}#contact">Contact</a>
    <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="links">${ICO('menu')}</button>
  </div></header>`;
  const b = document.querySelector('.burger'), l = document.getElementById('links');
  b.addEventListener('click', () => b.setAttribute('aria-expanded', l.classList.toggle('open')));
  l.addEventListener('click', e => { if (e.target.closest('a')) { l.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
}

/* footer */
const footEl = document.querySelector('[data-footer]');
if (footEl) {
  footEl.outerHTML = `<footer><div class="wrap">
    <div>
      <a class="logo" href="/" aria-label="Cejiroh home"><img class="d" src="/assets/logo/logo-dark.svg" alt="" width="91" height="24"><img class="l" src="/assets/logo/logo-light.svg" alt="" width="91" height="24"></a>
      <p>© ${new Date().getFullYear()} Cejiroh · <a href="mailto:${CONFIG.email}">${CONFIG.email}</a></p>
      <p>Icons: <a href="https://github.com/saoudi-h/solar-icons">Solar</a> by 480 Design, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
    </div>
    <ul>${NAV.concat([['Photography', '/photography/'], ['3D Art', '/3d-art/']]).map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul>
  </div></footer>`;
}

/* contact form */
const form = document.getElementById('contact-form');
if (form) {
  const status = form.querySelector('.status'), btn = form.querySelector('button');
  form.elements['Source'].value = form.dataset.source || document.body.dataset.page || '';
  form.elements.ts.value = Date.now();                      // when the page loaded (server checks this too)
  if (CONFIG.turnstileSiteKey) {
    const w = document.createElement('div');
    w.className = 'cf-turnstile'; w.dataset.sitekey = CONFIG.turnstileSiteKey;
    btn.before(w);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true;
    document.head.append(s);
  }
  const say = (t, cls) => { status.textContent = t; status.className = 'status ' + (cls || ''); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form);
    const name = (d.get('Full Name') || '').trim(), email = (d.get('Email') || '').trim(), msg = (d.get('Message') || '').trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || msg.length < 5) return say(MSG.fields, 'err');
    if (Date.now() - Number(form.elements.ts.value) < CONFIG.minSeconds * 1000) return say(MSG.fast, 'err');
    if (!CONFIG.formUrl) return say(MSG.fail, 'err');
    btn.disabled = true; say('Sending…');
    try {
      // honeypot ("website"), ts, Source and the Turnstile token (if on) travel with the fields
      const res = await fetch(CONFIG.formUrl, { method: 'POST', body: new URLSearchParams(d) });
      const out = await res.json();
      // out.result === 'success' is the reply format of the old script
      if (out.ok || out.result === 'success') { form.reset(); form.elements.Source.value = form.dataset.source || ''; form.elements.ts.value = Date.now(); say(MSG.ok, 'ok'); }
      else say(out.error || MSG.fail, 'err');
    } catch (_) { say(MSG.fail, 'err'); }
    btn.disabled = false;
    if (window.turnstile) try { turnstile.reset(); } catch (_) {}
  });
}

/* motion (all of it is skipped when the visitor prefers reduced motion) */
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ticker: loops forever and speeds up with scroll speed */
const tr = document.querySelector('.track');
if (tr && !calm) {
  tr.innerHTML += tr.innerHTML;
  let x = 0, last = scrollY, boost = 0;
  const half = () => tr.scrollWidth / 2;
  (function tick() {
    boost = boost * .9 + Math.abs(scrollY - last) * .15; last = scrollY;
    x -= .7 + Math.min(boost, 18);
    if (-x >= half()) x += half();
    tr.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(tick);
  })();
}

/* statement: words light up as it scrolls into view */
const st = document.querySelector('.stmt');
if (st && !calm) {
  st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span>${w}</span>`).join(' ');
  const sp = [...st.children];
  const upd = () => {
    const r = st.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .3)));
    sp.forEach((s, i) => s.classList.toggle('on', i / sp.length < p));
  };
  addEventListener('scroll', upd, { passive: true }); upd();
}

/* services: the preview image follows the cursor (mouse screens only) */
if (matchMedia('(hover:hover) and (min-width:860px)').matches && !calm) {
  document.querySelectorAll('.idx a').forEach(a => {
    const p = a.querySelector('.pic'); let x = 0, y = 0, tx = 0, ty = 0, on = false, raf;
    const loop = () => {
      x += (tx - x) * .15; y += (ty - y) * .15;
      p.style.setProperty('--x', x + 'px'); p.style.setProperty('--y', y + 'px');
      p.style.setProperty('--r', Math.max(-8, Math.min(8, (tx - x) * .06)) + 'deg');
      if (on) raf = requestAnimationFrame(loop);
    };
    a.addEventListener('pointerenter', e => { tx = x = e.clientX + 24; ty = y = e.clientY - 90; on = true; loop(); });
    a.addEventListener('pointermove', e => { tx = e.clientX + 24; ty = e.clientY - 90; });
    a.addEventListener('pointerleave', () => { on = false; cancelAnimationFrame(raf); });
  });
}
