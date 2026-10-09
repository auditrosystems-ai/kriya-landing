// Small interactive pieces carried over from the original site. Each block does nothing if its markup isn't on the page.
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = 'https://wa.me/919874700058?text=';

  // ---------- reading progress ----------
  const bar = document.createElement('div'); bar.id = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const upd = () => { const h = document.documentElement, max = h.scrollHeight - h.clientHeight; bar.style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + '%'; };
  window.addEventListener('scroll', upd, { passive: true }); upd();

  // ---------- tilt cards toward the pointer (mouse only) ----------
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-3px)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- pain list: "That's me" ----------
  const rows = $$('.pain-row'), pc = $('#painCount');
  if (rows.length && pc) {
    const target = pc.dataset.target || '#leak';
    rows.forEach(r => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'me'; b.textContent = "That's me"; b.setAttribute('aria-pressed', 'false');
      r.appendChild(b);
      r.addEventListener('click', () => { const on = r.classList.toggle('on'); b.textContent = on ? "✓ That's me" : "That's me"; b.setAttribute('aria-pressed', on); count(); });
    });
    const count = () => {
      const n = rows.filter(r => r.classList.contains('on')).length;
      pc.innerHTML = !n ? 'Tap <b>That\'s me</b> on any that sound familiar.'
        : n === rows.length ? '<b>All five.</b> You are not alone: that is most businesses. <a href="' + target + '">See what it costs you ↓</a>'
        : '<b>' + n + ' of ' + rows.length + '</b> sound familiar. Each one is a leak. <a href="' + target + '">See what it costs you ↓</a>';
    };
  }

  // ---------- what you want: tap to pick, builds the WhatsApp message ----------
  const wants = $$('.want-card'), wt = $('#wantText'), wb = $('#wantBtn');
  if (wants.length && wt) {
    wants.forEach(c => c.addEventListener('click', () => { c.classList.toggle('on'); c.setAttribute('aria-pressed', c.classList.contains('on')); pick(); }));
    const pick = () => {
      const picked = wants.filter(c => c.classList.contains('on')).map(c => $('h3', c).textContent.replace(/\.$/, ''));
      if (!picked.length) { wt.textContent = 'Pick as many as you like.'; wb.hidden = true; return; }
      wt.innerHTML = picked.length === wants.length
        ? '<b>All four.</b> That is exactly what the free trial is set up to show you, with your own leads.'
        : 'You picked <b>' + picked.length + ' of ' + wants.length + '</b>. Kriya can show you ' + (picked.length === 1 ? 'that' : 'those') + ' working with your own leads, free for 15 days.';
      wb.hidden = false;
      wb.href = WA + encodeURIComponent("Hi Akshay, I saw Kriya. What I want most:\n- " + picked.join('\n- '));
    };
  }

  // ---------- today vs Kriya: tap a row on touch screens ----------
  const vsr = $$('.vs-row');
  vsr.forEach(r => r.addEventListener('click', () => { vsr.forEach(x => x !== r && x.classList.remove('hl')); r.classList.toggle('hl'); }));

  // ---------- capture demo ----------
  const cb = $('#capBtn'), co = $('#capOut');
  if (cb && co) cb.addEventListener('click', () => { co.classList.remove('go'); void co.offsetWidth; co.classList.add('go'); cb.textContent = '↻ Play again'; });

  // ---------- also included chips ----------
  const info = $('#incInfo'), chips = $$('.inc button');
  if (info) {
    const show = c => { chips.forEach(x => x.classList.toggle('on', x === c)); info.innerHTML = '<b>' + c.textContent + ':</b> ' + c.dataset.i; };
    chips.forEach(c => { c.addEventListener('click', () => show(c)); c.addEventListener('mouseenter', () => show(c)); });
  }

  // ---------- is this for you: tap checklist ----------
  const fl = $$('#fitYes li'), fv = $('#fitVerdict');
  if (fl.length && fv) {
    const says = ['', 'One is a start. Keep going.', 'Two out of four. Worth a look.', 'Three out of four. Kriya was built for businesses like yours.', 'All four. This is exactly who Kriya is for. <a class="txt-link" href="start.html">Start your free trial →</a>'];
    fl.forEach(li => {
      li.setAttribute('role', 'checkbox'); li.setAttribute('tabindex', '0'); li.setAttribute('aria-checked', 'false');
      const t = () => { const on = li.classList.toggle('on'); li.setAttribute('aria-checked', on); fv.innerHTML = says[fl.filter(x => x.classList.contains('on')).length]; };
      li.addEventListener('click', t); li.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); t(); } });
    });
  }

  // ---------- team size: per-person vs flat ----------
  const tr = $('#tR');
  if (tr) {
    const g = id => document.getElementById(id);
    const set = () => {
      const n = +tr.value;
      tr.style.setProperty('--p', ((n - 1) / 49 * 100) + '%');
      g('tN').textContent = n + (n === 1 ? ' person' : ' people');
      g('tbSeat').style.width = Math.max(2, n / 50 * 100) + '%';
      g('tbSeatX').textContent = n + '×';
      g('tNote').textContent = n === 1 ? 'Now drag it up, the way a growing business does.'
        : 'With ' + n + ' people, a per-person CRM costs ' + n + ' times one seat. Kriya stays at one flat price.';
    };
    tr.addEventListener('input', set); set();
  }
})();
