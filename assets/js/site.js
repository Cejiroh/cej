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

/* nav behaviour: the nav and footer are plain HTML in every page (so search engines read them); this only adds the menu button */
const burger = document.querySelector('.burger'), links = document.getElementById('links');
if (burger && links) {
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', links.classList.toggle('open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
}
document.querySelectorAll('.yr').forEach(y => { y.textContent = new Date().getFullYear(); });

/* contact forms: ONE markup and ONE handler, used by both the bottom form and the popup */
const SERVICES = ['3D Modeling', 'Product Videos', 'Website', 'Graphics', 'Product Showcase', 'Photography', '3D Art', 'Something else', 'Not sure yet'];
const PAGE_SERVICE = { '3d': '3D Modeling', videos: 'Product Videos', website: 'Website', graphics: 'Graphics', products: 'Product Showcase', photography: 'Photography', '3d-art': '3D Art' };
const PAGE_NAME = { hub: 'Home', '3d': '3D Modeling', videos: 'Product Videos', website: 'Websites', graphics: 'Graphics', products: 'Product Showcase', photography: 'Photography', '3d-art': '3D Art' };
const formHTML = `
  <label>Full name<input name="Full Name" autocomplete="name" required maxlength="80"></label>
  <label>Email<input name="Email" type="email" autocomplete="email" required maxlength="120"></label>
  <div class="row2">
    <label>Service type<select name="Service Type">${SERVICES.map(x => `<option>${x}</option>`).join('')}</select></label>
    <label>Budget<span class="bud"><select name="Currency" aria-label="Currency"><option value="USD">USD $</option><option value="PHP">PHP ₱</option></select><input name="Budget amount" type="text" inputmode="decimal" autocomplete="off" maxlength="12" placeholder="Optional" aria-label="Budget amount"></span></label>
  </div>
  <label>Message<textarea name="Message" required minlength="5" maxlength="2000"></textarea></label>
  <div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <input type="hidden" name="Company Name" value="cejiroh"><input type="hidden" name="Source"><input type="hidden" name="Source page"><input type="hidden" name="Budget"><input type="hidden" name="ts">
  <button class="btn" type="submit">Send message</button><p class="status" role="status" aria-live="polite"></p>`;

const page = document.body.dataset.page || '';

function wireForm(form, kind) {            // each form keeps its own state, status line and timer
  const status = form.querySelector('.status'), btn = form.querySelector('button[type=submit]');
  const where = (PAGE_NAME[page] || page) + ' (' + location.pathname.replace(/index\.html$/, '') + ') · ' + (kind === 'popup' ? 'popup form' : 'bottom form');
  const stamp = () => {
    form.elements.Source.value = page + (kind === 'popup' ? ' (popup)' : '');
    form.elements['Source page'].value = where;                                  // which page and which form it was sent from
    form.elements['Service Type'].value = PAGE_SERVICE[page] || 'Not sure yet';  // starts on this page's service
    form.elements.ts.value = Date.now();
  };
  stamp();                                   // ts = when the form appeared (the server checks it too)
  if (CONFIG.turnstileSiteKey) {
    const w = document.createElement('div');
    w.className = 'cf-turnstile'; w.dataset.sitekey = CONFIG.turnstileSiteKey; btn.before(w);
    if (!document.querySelector('script[data-ts]')) {
      const t = document.createElement('script');
      t.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; t.async = true; t.dataset.ts = ''; document.head.append(t);
    }
  }
  const amtEl = form.elements['Budget amount'];          // digits and one decimal point only (no "e", "+" or "-")
  amtEl.addEventListener('beforeinput', e => { if (e.data && !/^[0-9.]+$/.test(e.data)) e.preventDefault(); });
  amtEl.addEventListener('input', () => {
    let v = amtEl.value.replace(/[^0-9.]/g, ''); const i = v.indexOf('.');
    if (i > -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
    if (v !== amtEl.value) amtEl.value = v;
  });
  const say = (t, cls) => { status.textContent = t; status.className = 'status ' + (cls || ''); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form);
    const amt = String(d.get('Budget amount') || '').trim();
    d.set('Budget', amt && Number(amt) >= 0 ? d.get('Currency') + ' ' + amt : 'Not specified');   // USD unless PHP is picked
    d.delete('Budget amount'); d.delete('Currency');
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
  const f = makeForm(); m.replaceWith(f); wireForm(f, 'bottom');
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
wireForm(pf, 'popup');             // the sheet column shows which form a message came from
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
  if (c) { e.preventDefault(); openSheet(c); return; }
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

/* image viewer. Images with the same data-lb value belong to one set and browse together */
const lbAll = [...document.querySelectorAll('a[data-lb]')];
if (lbAll.length) {
  const box = document.createElement('div');
  box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = `<button class="lb-x" type="button" aria-label="Close">${ICO('close')}</button><button class="lb-p" type="button" aria-label="Previous image">${ICO('prev')}</button><img alt=""><button class="lb-n" type="button" aria-label="Next image">${ICO('next')}</button>`;
  document.body.append(box);
  const im = box.querySelector('img'); let items = lbAll, i = 0, from = null, sx = 0;
  box.insertAdjacentHTML('beforeend', '<span class="hexload" aria-hidden="true"><b><i></i><i></i><i></i><i></i><i></i><i></i><i></i></b></span>');
  im.addEventListener('load', () => box.classList.remove('loading')); im.addEventListener('error', () => box.classList.remove('loading'));
  const show = n => { i = (n + items.length) % items.length; box.classList.add('loading'); im.src = items[i].getAttribute('href'); im.alt = items[i].querySelector('img').alt; if (im.complete && im.naturalWidth) box.classList.remove('loading'); };
  const shut = () => { box.classList.remove('open'); document.body.style.overflow = ''; if (from) from.focus(); };
  lbAll.forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); from = a; items = lbAll.filter(x => x.dataset.lb === a.dataset.lb);
    box.classList.toggle('single', items.length < 2); show(items.indexOf(a)); box.classList.add('open'); document.body.style.overflow = 'hidden'; box.querySelector('.lb-x').focus();
  }));
  box.addEventListener('click', e => { if (e.target.closest('.lb-x') || e.target === box) shut(); else if (e.target.closest('.lb-p')) show(i - 1); else if (e.target.closest('.lb-n')) show(i + 1); });
  document.addEventListener('keydown', e => { if (!box.classList.contains('open')) return; if (e.key === 'Escape') shut(); else if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1); });
  box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50 && items.length > 1) show(i + (dx < 0 ? 1 : -1)); }, { passive: true });
}

/* themed play button on every video, on desktop and phones (the browser's own controls stay underneath) */
document.querySelectorAll('.m.v video').forEach(v => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'vplay'; b.setAttribute('aria-label', 'Play video');
    v.parentElement.append(b);
  b.addEventListener('click', () => { v.play(); });
  v.addEventListener('play', () => b.classList.add('hide'));
  v.addEventListener('pause', () => b.classList.remove('hide'));
  v.addEventListener('ended', () => b.classList.remove('hide'));
});

/* content protection: no text selection, no dragging, no right-click menu. Form fields keep working. */
const editable = t => t && t.closest && t.closest('input,textarea,select');
document.addEventListener('contextmenu', e => { if (!editable(e.target)) e.preventDefault(); });
document.addEventListener('selectstart', e => { if (!editable(e.target)) e.preventDefault(); });
document.addEventListener('dragstart', e => e.preventDefault());

/* hexagon loader on every image until it has loaded */
document.querySelectorAll('main img').forEach(img => {
  if (img.complete && img.naturalWidth) return;
  const host = img.parentElement, r = host.getBoundingClientRect();
  if (host.closest('.logo,.brand') || r.width < 110 || r.height < 110) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.insertAdjacentHTML('beforeend', '<span class="hexload" aria-hidden="true"><b><i></i><i></i><i></i><i></i><i></i><i></i><i></i></b></span>');
  const hl = host.lastElementChild, done = () => { hl.classList.add('out'); setTimeout(() => hl.remove(), 350); };
  img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true });
});

/* when the page has fully loaded: get its videos ready, then quietly fetch the other pages.
   Skipped on Data Saver and slow connections so it never costs visitors data they didn't choose to use. */
window.addEventListener('load', () => {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  const c = navigator.connection || {};
  if (c.saveData || /(^|-)2g$|3g/.test(c.effectiveType || '')) return;
  (window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => {
    const vids = [...document.querySelectorAll('.m.v video')];
    vids.forEach(v => { if (v.preload === 'none') v.preload = 'metadata'; });                       // length and first frame ready
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.preload = 'auto'; io.unobserve(e.target); } }), { rootMargin: '600px 0px' });
    vids.forEach(v => io.observe(v));                                                              // videos near the screen buffer ahead
    const here = location.pathname.replace(/index\.html$/, '');
    ['/', '/3d/', '/videos/', '/website/', '/graphics/', '/products/', '/photography/', '/3d-art/'].filter(p => p !== here).forEach((p, n) => setTimeout(() => {
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = p; document.head.append(l);
      const slug = p.replace(/\//g, '');
      if (slug) { const k = document.createElement('link'); k.rel = 'prefetch'; k.as = 'style'; k.href = '/assets/css/p-' + slug + '.css'; document.head.append(k); }
    }, n * 400));
  });
});
