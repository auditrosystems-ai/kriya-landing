// Kriya site: shared behaviour (menu, reveal, FAQ, pixel events, source tracking, trial form, pricing toggle, hero loop).
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const track = (ev, params, custom) => { try { if (window.fbq) custom ? fbq('trackCustom', ev, params || {}) : fbq('track', ev, params || {}); } catch (e) {} };

  // ---------- mobile menu ----------
  const hdr = $('.hdr'), mb = $('.menu-btn');
  if (mb) mb.addEventListener('click', () => { const o = hdr.classList.toggle('menu-open'); mb.setAttribute('aria-expanded', o); });

  // ---------- reveal on scroll ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    $$('.rv').forEach(el => io.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  // ---------- FAQ ----------
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item), a = $('.faq-a', item);
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => { const open = item.classList.toggle('open'); q.setAttribute('aria-expanded', open); a.style.maxHeight = open ? a.scrollHeight + 'px' : '0'; });
  });

  // ---------- pixel: WhatsApp taps, leak check use ----------
  document.addEventListener('click', e => { const a = e.target.closest('a[href*="wa.me"]'); if (a) track('Contact', { content_name: (a.textContent || 'WhatsApp').trim().slice(0, 60) }); });
  let leakDone = false;
  ['lA', 'lB', 'lC', 'lD'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', () => { if (!leakDone) { leakDone = true; track('LeakCheckUsed', {}, true); } }); });

  // ---------- where the visitor came from (kept for the session, sent with the form) ----------
  const utm = (() => {
    let v = ''; try { v = sessionStorage.getItem('kriyaUtm') || ''; } catch (_) {}
    if (!v) {
      const p = new URLSearchParams(location.search);
      v = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].filter(k => p.get(k)).map(k => k === 'fbclid' ? 'fbclid (Meta ad)' : k + '=' + p.get(k)).join('&');
      if (!v && document.referrer && !document.referrer.includes(location.hostname)) v = 'referrer=' + document.referrer;
      try { if (v) sessionStorage.setItem('kriyaUtm', v); } catch (_) {}
    }
    return v.slice(0, 300);
  })();

  // ---------- pricing: monthly / yearly ----------
  const tog = $('.bill-toggle');
  if (tog) {
    const set = mode => {
      $$('button', tog).forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
      $$('[data-m]').forEach(el => { el.textContent = el.dataset[mode === 'y' ? 'y' : 'm']; });
      $$('[data-plan-link]').forEach(a => { const u = new URL(a.getAttribute('href'), location.href); u.searchParams.set('billing', mode === 'y' ? 'yearly' : 'monthly'); a.setAttribute('href', u.pathname.split('/').pop() + u.search); });
    };
    $$('button', tog).forEach(b => b.addEventListener('click', () => set(b.dataset.mode)));
    set('m');
  }

  // ---------- trial / demo form -> Kriya CRM ----------
  const form = document.getElementById('trialForm');
  if (form) {
    const ENDPOINT = 'https://auditrocrm.netlify.app/.netlify/functions/kriya-lead';
    const msg = $('.f-msg', form), picks = {};
    const qs = new URLSearchParams(location.search);
    // preselect plan / billing / intent from the link that brought them here
    const pre = { plan: qs.get('plan') === 'basic' ? 'Basic' : qs.get('plan') === 'pro' ? 'Pro' : '', billing: qs.get('billing') === 'yearly' ? 'Yearly' : qs.get('billing') === 'monthly' ? 'Monthly' : '', intent: qs.get('intent') === 'demo' ? 'Book a demo' : '' };
    $$('.f-chips, .seg', form).forEach(fs => {
      const name = fs.dataset.name;
      const choose = b => {
        $$('button', fs).forEach(x => x.classList.toggle('on', x === b)); picks[name] = b ? b.textContent.trim() : '';
        if (name === 'intent') $('button[type=submit]', form).textContent = picks.intent === 'Book a demo' ? 'Book my demo' : 'Start my free trial';
      };
      $$('button', fs).forEach(b => b.addEventListener('click', () => { const was = b.classList.contains('on') && !fs.classList.contains('seg'); choose(was ? null : b); }));
      const want = pre[name]; if (want) { const b = $$('button', fs).find(x => x.textContent.trim() === want); if (b) choose(b); }
      if (fs.classList.contains('seg') && !picks[name]) choose($('button', fs));
    });
    let leak = ''; try { leak = sessionStorage.getItem('kriyaLeak') || ''; } catch (_) {}
    const lb = $('.f-leak', form); if (leak && lb) { lb.hidden = false; lb.innerHTML = '<b>Your leak check will be sent too:</b> ' + leak; }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.className = 'f-msg'; msg.textContent = '';
      const f = form.elements, phone = f.phone.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0/, '');
      let bad = false;
      [f.name, f.phone].forEach(x => x.classList.remove('bad'));
      if (!f.name.value.trim()) { f.name.classList.add('bad'); bad = true; }
      if (!/^\d{10}$/.test(phone)) { f.phone.classList.add('bad'); bad = true; }
      if (bad) { msg.className = 'f-msg err'; msg.textContent = 'Please add your name and a 10-digit mobile number.'; return; }
      const btn = $('button[type=submit]', form), label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
      const intent = picks.intent || 'Free trial';
      const planLine = [intent, picks.plan && ('Plan: ' + picks.plan), picks.billing && ('Billing: ' + picks.billing)].filter(Boolean).join(' · ');
      const body = { name: f.name.value, phone, email: f.email.value, business: f.business.value, city: f.city.value,
        industry: picks.industry || '', team: picks.team || '', problem: picks.problem || '',
        message: [planLine, f.message.value.trim()].filter(Boolean).join('\n'), leak, utm, company_site: f.company_site.value };
      try {
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const res = await r.json().catch(() => ({}));
        if (r.status === 400 && res.error && res.error.includes('10-digit')) { btn.disabled = false; btn.textContent = label; f.phone.classList.add('bad'); msg.className = 'f-msg err'; msg.textContent = 'Please enter a valid 10-digit mobile number.'; return; }
        if (!r.ok || !res.ok) throw new Error(r.status);
        track('Lead', { content_name: intent });
        const first = (f.name.value.trim().split(/\s+/)[0] || '').replace(/[<>&"]/g, '');
        form.innerHTML = '<div class="f-done"><div class="ok">✓</div><h3>Thank you' + (first ? ', ' + first : '') + '.</h3><p>I\'ll reach out on WhatsApp at <b>' + phone.replace(/(\d{5})(\d{5})/, '$1 $2') + '</b> within one working day to set up your ' + (intent === 'Book a demo' ? 'demo' : 'free trial') + '.</p><a class="btn btn-wa" href="https://wa.me/919874700058?text=' + encodeURIComponent('Hi Akshay, I just filled the form on kriyasystems.in.') + '" target="_blank" rel="noopener">Or message me now</a></div>';
      } catch (err) {
        btn.disabled = false; btn.textContent = label;
        msg.className = 'f-msg err'; msg.innerHTML = 'Something went wrong. Please try again, or <a class="txt-link" href="https://wa.me/919874700058" target="_blank" rel="noopener">WhatsApp 98747 00058</a>.';
      }
    });
  }

  // ---------- hero loop: scattered enquiries -> Kriya -> order ----------
  const loop = document.getElementById('loop');
  if (loop && window.gsap) {
    const chaos = $$('.lc[data-c]', loop), outs = $$('.lc[data-o]', loop), logo = $('.loop-logo', loop), cap = $('.loop-cap', loop);
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const caps = ['Where your enquiries live today', 'All of it, in one place', 'Every follow-up, on time'];
    const setCap = t => gsap.fromTo(cap, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .4, onStart: () => { cap.textContent = t; } });
    chaos.forEach((c, i) => c._r = (i % 2 ? 1 : -1) * (3 + (i * 3) % 6));
    gsap.set(outs, { opacity: 0, scale: .3 });
    gsap.set(chaos, { opacity: 0, scale: .9, rotation: i => chaos[i]._r });
    if (reduce) { gsap.set(chaos, { opacity: 1, scale: 1 }); cap.textContent = caps[0]; return; }
    const tl = gsap.timeline({ repeat: -1, repeatDelay: .4 });
    tl.call(() => setCap(caps[0]))
      .to(chaos, { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: 'power2.out' })
      .to(chaos, { x: (i, el) => (loop.clientWidth / 2 - el.offsetLeft - el.offsetWidth / 2), y: (i, el) => (loop.clientHeight * .44 - el.offsetTop - el.offsetHeight / 2), scale: .2, opacity: 0, rotation: 0, duration: .9, stagger: .05, ease: 'power3.in' }, '+=2.2')
      .call(() => setCap(caps[1]), null, '<')
      .fromTo(logo, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.7)' }, '-=.2')
      .to(logo, { scale: 1.06, duration: .25, yoyo: true, repeat: 1 }, '+=.3')
      .call(() => setCap(caps[2]))
      .fromTo(outs, { opacity: 0, scale: .3, x: (i, el) => (loop.clientWidth / 2 - el.offsetLeft - el.offsetWidth / 2) * .8, y: (i, el) => (loop.clientHeight * .44 - el.offsetTop - el.offsetHeight / 2) * .8 },
        { opacity: 1, scale: 1, x: 0, y: 0, duration: .7, stagger: .08, ease: 'power3.out' })
      .to([outs, logo], { opacity: 0, duration: .5, stagger: .02 }, '+=2.6')
      .set(chaos, { x: 0, y: 0, scale: .9, rotation: i => chaos[i]._r });
  }
})();
