// ---------- live quotation builder ----------
(function(){
  const box=document.getElementById('qbItems'); if(!box) return;
  const g=id=>document.getElementById(id);
  const inr=v=>'₹'+Math.round(v).toLocaleString('en-IN');
  // simple flat product thumbnails, drawn in the site palette
  const svg=b=>'<svg viewBox="0 0 48 48" aria-hidden="true">'+b+'</svg>';
  const pic={
    sofa:svg('<rect width="48" height="48" rx="10" fill="#EFD98F"/><rect x="9" y="16" width="30" height="12" rx="4" fill="#C9A227"/><rect x="6" y="22" width="36" height="11" rx="4" fill="#0F7A5A"/><rect x="8" y="33" width="3" height="5" rx="1" fill="#2B2E35"/><rect x="37" y="33" width="3" height="5" rx="1" fill="#2B2E35"/>'),
    blinds:svg('<rect width="48" height="48" rx="10" fill="#CFE8DC"/><rect x="10" y="8" width="28" height="3" rx="1.5" fill="#2B2E35"/><g fill="#1E7A4F"><rect x="12" y="13" width="24" height="3" rx="1"/><rect x="12" y="18" width="24" height="3" rx="1"/><rect x="12" y="23" width="24" height="3" rx="1"/><rect x="12" y="28" width="24" height="3" rx="1"/></g><rect x="33" y="31" width="2" height="9" fill="#2B2E35"/>'),
    lamp:svg('<rect width="48" height="48" rx="10" fill="#2B2E35"/><rect x="23" y="5" width="2" height="12" fill="#B4B7C0"/><path d="M12 30a12 12 0 0 1 24 0z" fill="#E8B84B"/><circle cx="24" cy="33" r="4" fill="#FFF3C4"/>'),
    panels:svg('<rect width="48" height="48" rx="10" fill="#DDD8CF"/><g fill="#2B2E35"><rect x="9" y="9" width="8" height="30" rx="2"/><rect x="20" y="9" width="8" height="30" rx="2" opacity=".75"/><rect x="31" y="9" width="8" height="30" rx="2" opacity=".5"/></g>'),
    install:svg('<rect width="48" height="48" rx="10" fill="#0F7A5A"/><path d="M31 12a7 7 0 0 0-8.5 9L12 31.5l4.5 4.5L27 25.5a7 7 0 0 0 9-8.5l-4 4-4.5-1-1-4.5z" fill="#fff"/>'),
    amc:svg('<rect width="48" height="48" rx="10" fill="#1E7A4F"/><path d="M24 9l12 5v9c0 8-5 13-12 16-7-3-12-8-12-16v-9z" fill="#CFE8DC"/><path d="M18 24l4 4 8-8" stroke="#1E7A4F" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
  };
  const items=[
    {n:'Modular sofa, 3‑seater',p:84000,q:1,on:true,img:pic.sofa},
    {n:'Motorised blinds, per window',p:18500,q:4,on:true,img:pic.blinds},
    {n:'Designer pendant light',p:12400,q:2,on:true,img:pic.lamp},
    {n:'Acoustic wall panels, 100 sq ft',p:65000,q:1,on:false,img:pic.panels},
    {n:'Installation and commissioning',p:15000,q:1,on:false,img:pic.install},
    {n:'Annual maintenance',p:9000,q:1,on:false,img:pic.amc}
  ];
  let last=null;
  items.forEach((it,i)=>{
    const el=document.createElement('div'); el.className='qb-item'+(it.on?' on':''); el.setAttribute('role','checkbox'); el.setAttribute('tabindex','0');
    el.innerHTML='<span class="qb-chk">✓</span><span class="qb-it"><span class="qb-thumb">'+it.img+'</span><span><b>'+it.n+'</b><span class="p">'+inr(it.p)+' each</span></span></span><span class="qb-qty"><button type="button" aria-label="Fewer">−</button><em>'+it.q+'</em><button type="button" aria-label="More">+</button></span>';
    const [minus,plus]=el.querySelectorAll('.qb-qty button'), qEl=el.querySelector('em');
    const toggle=()=>{ it.on=!it.on; el.classList.toggle('on',it.on); last=it.on?i:null; render(); };
    el.addEventListener('click',e=>{ if(e.target.closest('.qb-qty')) return; toggle(); });
    el.addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); toggle(); } });
    minus.addEventListener('click',()=>{ it.q=Math.max(1,it.q-1); qEl.textContent=it.q; last=i; render(); });
    plus.addEventListener('click',()=>{ it.q=Math.min(20,it.q+1); qEl.textContent=it.q; last=i; render(); });
    box.appendChild(el);
  });
  const disc=g('qbDisc');
  disc.addEventListener('input',render);
  // brand colour
  document.querySelectorAll('#qbSw button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#qbSw button').forEach(x=>x.classList.toggle('on',x===b));
    g('qbDoc').style.setProperty('--brand',b.style.getPropertyValue('--c'));
  }));
  // page tabs
  const tabs=[...document.querySelectorAll('.qb-tabs button')], pages=[...document.querySelectorAll('.qb-page')];
  const show=p=>{ tabs.forEach(t=>t.classList.toggle('on',t.dataset.p===p)); pages.forEach(x=>x.classList.toggle('on',x.dataset.p===p)); };
  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.p)));
  let userPicked=false; tabs.forEach(t=>t.addEventListener('click',()=>userPicked=true));
  function render(){
    const d=+disc.value; disc.style.setProperty('--p',(d/20*100)+'%'); g('qbDiscO').textContent=d+'%';
    const sel=items.filter(x=>x.on);
    let listT=0, sub=0;
    g('qbRows').innerHTML = sel.length ? sel.map(x=>{
      const list=x.p*x.q, net=list*(1-d/100); listT+=list; sub+=net;
      return '<div class="qb-row'+(items.indexOf(x)===last?' new':'')+'"><span class="qb-it"><span class="qb-thumb sm">'+x.img+'</span><span>'+x.n+(x.q>1?' × '+x.q:'')+'</span></span><span>'+(d?'<s>'+inr(list)+'</s>':inr(list))+'</span><b>'+inr(net)+'</b></div>';
    }).join('') : '<div class="qb-empty">Tick a product on the left to add it.</div>';
    const gst=sub*0.18, tot=sub+gst;
    g('qbSub').textContent=inr(sub); g('qbGst').textContent=inr(gst);
    g('qbTotal').textContent=inr(tot); g('qbCoverTotal').textContent=inr(tot);
    g('qbCount').textContent=sel.length+(sel.length===1?' item':' items');
    g('qbSave').innerHTML = d&&sel.length ? 'Including a <b>'+d+'% discount</b>, shown line by line so the customer sees exactly what they are saving: <b>'+inr((listT-sub)*1.18)+'</b>.' : 'One clear figure. The last thing your customer looks at before deciding.';
    // after the visitor edits the quote, flip to the itemised page so they see it change
    if(last!==null && !userPicked) show('items');
  }
  render();
})();
