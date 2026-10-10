// Kriya plan payment: pick plan and billing, create a Razorpay subscription in the CRM's
// Netlify function, open Razorpay Checkout, then verify the payment signature server-side.
(function () {
  const form = document.getElementById('payForm'); if (!form) return;
  const API = 'https://auditrocrm.netlify.app/.netlify/functions/kriya-subscribe';
  const PRICE = { basic: { monthly: 499, yearly: 4999 }, pro: { monthly: 899, yearly: 8999 } };
  const $ = s => form.querySelector(s), msg = $('.f-msg'), btn = $('#payBtn');
  const inr = v => '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qs = new URLSearchParams(location.search);
  const st = { plan: qs.get('plan') === 'basic' ? 'basic' : 'pro', billing: qs.get('billing') === 'yearly' ? 'yearly' : 'monthly' };

  const render = () => {
    [['#pPlan', 'plan'], ['#pBill', 'billing']].forEach(([sel, k]) => form.querySelectorAll(sel + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === st[k])));
    const base = PRICE[st.plan][st.billing], gst = Math.round(base * 18) / 100, tot = Math.round((base + gst) * 100) / 100;
    $('#sLabel').textContent = 'Kriya ' + (st.plan === 'pro' ? 'Pro' : 'Basic') + ', ' + st.billing;
    $('#sBase').textContent = inr(base); $('#sGst').textContent = inr(gst); $('#sTot').textContent = inr(tot);
    $('#sPer').textContent = 'Total per ' + (st.billing === 'yearly' ? 'year' : 'month');
    btn.textContent = 'Pay ' + inr(tot) + ' securely';
  };
  form.querySelectorAll('#pPlan button').forEach(b => b.addEventListener('click', () => { st.plan = b.dataset.v; render(); }));
  form.querySelectorAll('#pBill button').forEach(b => b.addEventListener('click', () => { st.billing = b.dataset.v; render(); }));
  render();

  // Razorpay's checkout script, loaded only on this page
  const loadCheckout = () => new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = res; s.onerror = () => rej(new Error('checkout script')); document.head.appendChild(s);
  });
  const post = async body => {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Something went wrong'); return d;
  };
  const fail = t => { btn.disabled = false; render(); msg.className = 'f-msg err'; msg.innerHTML = t; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'f-msg'; msg.textContent = '';
    const f = form.elements, phone = f.phone.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0/, '');
    [f.name, f.phone].forEach(x => x.classList.remove('bad'));
    if (!f.name.value.trim()) f.name.classList.add('bad');
    if (!/^\d{10}$/.test(phone)) f.phone.classList.add('bad');
    if (!f.name.value.trim() || !/^\d{10}$/.test(phone)) return fail('Please add your name and a 10-digit mobile number.');
    const gstin = f.gstin.value.trim().toUpperCase();
    f.state.classList.toggle('bad', !f.state.value); f.gstin.classList.remove('bad');
    if (!f.state.value) return fail('Please select your state. It decides the GST on your invoice.');
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(gstin)) { f.gstin.classList.add('bad'); return fail('That GSTIN does not look right. Please check it, or leave it empty.'); }
    btn.disabled = true; btn.textContent = 'Opening secure payment…';
    try {
      const [, sub] = await Promise.all([loadCheckout(), post({ action: 'create', plan: st.plan, billing: st.billing, name: f.name.value, phone, email: f.email.value, business: f.business.value, state: f.state.value, gstin, address: f.address.value.trim() })]);
      const rzp = new window.Razorpay({
        key: sub.key_id, subscription_id: sub.subscription_id, name: 'Kriya', description: 'Kriya ' + sub.plan,
        prefill: { name: f.name.value, email: f.email.value, contact: '+91' + phone },
        notes: { business: f.business.value }, theme: { color: '#0F7A5A' },
        modal: { ondismiss: () => fail('Payment window closed. Nothing was charged. You can try again, or <a class="txt-link" href="https://wa.me/919874700058" target="_blank" rel="noopener">WhatsApp us</a>.') },
        handler: async resp => {
          btn.textContent = 'Confirming…';
          try {
            await post({ action: 'verify', ...resp });
            try { if (window.fbq) fbq('track', 'Subscribe', { value: PRICE[st.plan][st.billing], currency: 'INR', predicted_ltv: PRICE[st.plan].yearly }); } catch (_) {}
            const first = (f.name.value.trim().split(/\s+/)[0] || '').replace(/[<>&"]/g, '');
            form.innerHTML = '<div class="f-done"><div class="ok">✓</div><h3>Payment received. Thank you' + (first ? ', ' + first : '') + '.</h3><p>You are on <b>Kriya ' + sub.plan + '</b>. Razorpay will email your receipt, and Akshay will WhatsApp you shortly. Your GST invoice follows.</p><p class="muted small">Payment ID: ' + resp.razorpay_payment_id + '</p></div>';
          } catch (err) {
            fail('Your payment went through, but we could not confirm it here. Please WhatsApp 98747 00058 with payment ID ' + resp.razorpay_payment_id + '.');
          }
        },
      });
      rzp.on('payment.failed', r => fail('Payment failed: ' + ((r.error && r.error.description) || 'please try again') + '. Nothing was charged.'));
      rzp.open();
    } catch (err) {
      fail(err.message === 'checkout script' ? 'Could not load Razorpay. Check your connection and try again.' : /fetch/i.test(err.message || '') ? 'Could not reach the payment server. Please try again in a minute.' : (err.message || 'Something went wrong') + ' <a class="txt-link" href="https://wa.me/919874700058" target="_blank" rel="noopener">WhatsApp us</a> if it keeps happening.');
    }
  });
})();
