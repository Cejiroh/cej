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
    <button class="btn" type="button" data-contact>Contact</button>
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

/* contact forms: ONE markup and ONE handler, used by both the bottom form and the popup */
const formHTML = `
  <label>Full name<input name="Full Name" autocomplete="name" required maxlength="80"></label>
  <label>Email<input name="Email" type="email" autocomplete="email" required maxlength="120"></label>
  <label>Message<textarea name="Message" required minlength="5" maxlength="2000"></textarea></label>
  <div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <input type="hidden" name="Company Name" value="cejiroh"><input type="hidden" name="Source"><input type="hidden" name="ts">
  <button class="btn" type="submit">Send message</button><p class="status" role="status" aria-live="polite"></p>`;
const page = document.body.dataset.page || '';

function wireForm(form, source) {            // each form keeps its own state, status line and timer
  const status = form.querySelector('.status'), btn = form.querySelector('button[type=submit]');
  const stamp = () => { form.elements.Source.value = source; form.elements.ts.value = Date.now(); };
  stamp();                                   // ts = when the form appeared (the server checks it too)
  if (CONFIG.turnstileSiteKey) {
    const w = document.createElement('div');
    w.className = 'cf-turnstile'; w.dataset.sitekey = CONFIG.turnstileSiteKey; btn.before(w);
    if (!document.querySelector('script[data-ts]')) {
      const t = document.createElement('script');
      t.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; t.async = true; t.dataset.ts = ''; document.head.append(t);
    }
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
      if (out.ok || out.result === 'success') { form.reset(); stamp(); say(MSG.ok, 'ok'); }
      else say(out.error || MSG.fail, 'err');
    } catch (_) { say(MSG.fail, 'err'); }
    btn.disabled = false;
    const cf = form.querySelector('.cf-turnstile');
    if (cf && window.turnstile) try { turnstile.reset(cf); } catch (_) {}
  });
}
function makeForm(source) {
  const f = document.createElement('form');
  f.className = 'cform'; f.noValidate = true; f.innerHTML = formHTML;
  return f;
}

/* 1. the form at the bottom of the page */
document.querySelectorAll('[data-contact-form]').forEach(m => {
  const f = makeForm(); m.replaceWith(f); wireForm(f, page);
});

/* 2. the popup: opens ONLY from the nav "Contact" button, slides down from the top */
const sheet = document.createElement('div');
sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
sheet.setAttribute('aria-labelledby', 'sheet-t'); sheet.setAttribute('aria-hidden', 'true');
sheet.innerHTML = `<div class="back" data-close></div><div class="sp">
  <button class="x" type="button" data-close aria-label="Close contact form">${ICO('close')}</button>
  <div class="wrap sg">
    <div><h2 id="sheet-t">Start a project</h2><p class="lead">Tell me what you need and I’ll get back to you.</p>
    <a class="mail" href="mailto:${CONFIG.email}">${ICO('mail')}${CONFIG.email}</a></div>
    <div data-slot></div>
  </div></div>`;
const pf = makeForm(); sheet.querySelector('[data-slot]').replaceWith(pf);
document.body.append(sheet);
wireForm(pf, page + ' (popup)');             // the sheet column shows which form a message came from
let opener = null;
const openSheet = el => {
  opener = el || null; sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  setTimeout(() => pf.querySelector('input').focus({ preventScroll: true }), 350);
};
const closeSheet = () => {
  sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  if (opener && opener.focus) opener.focus();
};
document.addEventListener('click', e => {
  const c = e.target.closest('[data-contact]');
  if (c) { openSheet(c); return; }
  if (e.target.closest('[data-close]')) closeSheet();
});
document.addEventListener('keydown', e => {
  if (!sheet.classList.contains('open')) return;
  if (e.key === 'Escape') return closeSheet();
  if (e.key === 'Tab') {   // keep Tab inside the popup
    const f = [...sheet.querySelectorAll('button,a[href],input:not([tabindex="-1"]),textarea')].filter(x => !x.disabled), a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});

/* before/after sliders */
document.querySelectorAll('.cmp input').forEach(i => i.addEventListener('input', () => i.parentElement.style.setProperty('--p', i.value + '%')));

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
