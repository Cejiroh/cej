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
const LOGO_LOADER = '<span class="hexload" aria-hidden="true"><svg viewBox="176 131 647 738" fill-rule="evenodd"><path d="M203.4,671.2l-0.1,-342.5l296.6,-171.2l296.6,171.2l0,342.5l-296.6,171.2l-296.5,-171.2Z" fill="#464646"/><path d="M192.9,688.8c-6.2,-3.6 -10,-10.2 -10,-17.3c-0,-54.8 -0,-288.2 -0.1,-343c-0,-7.1 3.8,-13.8 10,-17.3c47.5,-27.4 249.6,-144 297.1,-171.4c6.2,-3.6 13.8,-3.6 20,0c47.4,27.4 249.6,144.1 297,171.5c6.2,3.6 10,10.2 10,17.3c-0,54.8 -0,288.2 -0,343c0,7.1 -3.8,13.8 -10,17.3c-47.5,27.4 -249.6,144.1 -297.1,171.4c-6.2,3.6 -13.8,3.6 -20,-0c-47.4,-27.4 -249.6,-144.1 -297,-171.5Z" fill="#272626"/><path d="M531,482l-31.1,18l-296.6,-171.2l296.6,-171.2l296.6,171.2l-29.7,17.1l-201.6,-116.4c-8,-4.6 -16.1,-8.2 -24.3,-10.8c-8.2,-2.6 -16.3,-4.4 -24.2,-5.3c-8,-1 -15.7,-1.3 -23.2,-1c-7.5,0.3 -14.6,1.2 -21.2,2.5c-6.6,1.3 -12.7,3 -18.2,5c-5.6,2 -10.3,4.2 -14.3,6.5l-115.8,66.8c-7.3,4.2 -12.9,8.6 -16.8,13.2c-3.8,4.6 -6.3,9.1 -7.3,13.6c-1,4.5 -0.9,9 0.4,13.3c1.3,4.4 3.4,8.5 6.2,12.4c2.9,3.9 6.3,7.6 10.3,11c4,3.4 8.2,6.3 12.5,8.8l201.6,116.4Zm191.3,-110.4l-148.3,85.6l-203.6,-117.6c-6,-3.4 -9.1,-7 -9.4,-10.6c-0.3,-3.6 2.3,-7 7.8,-10.2l113.4,-65.5c5.8,-3.4 11.8,-5 18,-4.8c6.2,0.2 12.3,2 18.4,5.5l203.6,117.6Z" fill="#fff"/><path d="M531,482l-201.6,-116.4c-4.3,-2.5 -8.5,-5.4 -12.5,-8.8c-4,-3.4 -7.5,-7.1 -10.3,-11c-2.9,-3.9 -4.9,-8.1 -6.2,-12.4c-1.3,-4.4 -1.4,-8.8 -0.4,-13.3c1,-4.5 3.5,-9.1 7.3,-13.6c3.8,-4.6 9.4,-9 16.8,-13.2l115.8,-66.8c3.9,-2.3 8.7,-4.4 14.3,-6.5c5.6,-2 11.6,-3.7 18.2,-5c6.6,-1.3 13.6,-2.2 21.2,-2.5c7.5,-0.3 15.3,-0 23.2,1c8,1 16,2.8 24.2,5.3c8.2,2.6 16.3,6.2 24.3,10.8l201.6,116.4l-44.5,25.7l-203.6,-117.6c-6.1,-3.5 -12.2,-5.3 -18.4,-5.5c-6.2,-0.2 -12.2,1.4 -18,4.8l-113.4,65.5c-5.5,3.2 -8.1,6.6 -7.8,10.2c0.3,3.6 3.4,7.2 9.4,10.6l203.6,117.6l-43,24.8Z" fill="#464646" fill-rule="nonzero"/><path d="M796.5,328.8l-0,342.5l-296.6,171.2l0,-342.5l296.6,-171.2Z" fill="#464646"/><path d="M766.8,583.1c0,9.9 -1.5,19.9 -4.4,30.1c-3,10.2 -7.1,19.9 -12.4,29.2c-5.3,9.3 -11.6,17.8 -19,25.5c-7.3,7.7 -15.3,14.1 -24,19.1l-207.1,119.6l0,-49.7l205.7,-118.7c5.3,-3 9.4,-7.2 12.3,-12.3c3,-5.2 4.4,-10.9 4.4,-17.3l0,-236.9l44.5,-25.7l0,237.2Z" fill="#fff" fill-rule="nonzero"/><path d="M499.9,806.5l0,36l-296.6,-171.2l-0,-342.5l296.6,171.2l-0,34.2l-245.4,-141.7c-3.1,-1.8 -5.9,-2.8 -8.6,-3c-2.6,-0.3 -4.9,0.2 -6.8,1.4c-1.9,1.2 -3.4,3 -4.5,5.4c-1.1,2.4 -1.6,5.3 -1.6,8.7l0,178c0,12.8 2,24.8 6,35.9c4,11.1 9,21.2 15,30.1c6,9 12.5,16.7 19.5,23.1c7,6.5 13.5,11.4 19.4,14.8l207.1,119.6Zm0,-220.9l0,171.2l-205,-118.4c-5.7,-3.3 -10,-7.5 -13,-12.6c-3,-5.1 -4.4,-10.9 -4.4,-17.4l0,-151.3l222.4,128.4Zm-29.7,85.5l0,-51.4l-163.1,-94.2l0,51.4l163.1,94.2Z" fill="#a4a4a4"/><path d="M470.3,671.1l-163.1,-94.2l-0,-51.4l163.1,94.2l0,51.4Zm29.7,135.4l-207.1,-119.6c-5.9,-3.4 -12.4,-8.4 -19.4,-14.8c-7,-6.5 -13.5,-14.2 -19.5,-23.1c-6,-9 -11,-19 -15,-30.1c-4,-11.1 -6,-23.1 -6,-35.9l-0,-178c0,-3.4 0.5,-6.3 1.6,-8.7c1.1,-2.4 2.6,-4.2 4.5,-5.4c1.9,-1.2 4.2,-1.6 6.8,-1.4c2.6,0.3 5.5,1.3 8.6,3l245.4,141.7l0,51.4l-222.4,-128.4l-0,151.3c0,6.5 1.5,12.3 4.4,17.4c3,5.1 7.3,9.3 13,12.6l205,118.4l0,49.7Z" fill="#464646" fill-rule="nonzero"/></svg></span>';   // your logo cube, built piece by piece
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
  box.insertAdjacentHTML('beforeend', LOGO_LOADER);
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
  if (img.complete) return;                       // already finished (loaded or failed): nothing to wait for
  const host = img.parentElement, r = host.getBoundingClientRect();
  if (host.closest('.logo,.brand') || r.width < 110 || r.height < 110) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.insertAdjacentHTML('beforeend', LOGO_LOADER);
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
