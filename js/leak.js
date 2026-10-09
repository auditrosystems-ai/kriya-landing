// ---------- leak check: C x D x 12, live ----------
(function(){
  const g=id=>document.getElementById(id);
  const A=g('lA'),B=g('lB'),C=g('lC'),D=g('lD');
  if(!A) return;
  const inr=v=>'₹'+Math.round(v).toLocaleString('en-IN');
  let cTouched=false, shown=600000, raf=null;
  const fill=el=>el.style.setProperty('--p',((el.value-el.min)/(el.max-el.min)*100)+'%');
  function countTo(target){
    cancelAnimationFrame(raf);
    const from=shown, t0=performance.now();
    const step=t=>{ const k=Math.min(1,(t-t0)/450), e=1-Math.pow(1-k,3);
      shown=from+(target-from)*e; g('lYear').innerHTML=inr(shown)+' <span>a year</span>';
      if(k<1) raf=requestAnimationFrame(step); };
    raf=requestAnimationFrame(step);
    // safety net: always land on the right number, even if animation frames are paused
    clearTimeout(countTo.t); countTo.t=setTimeout(()=>{ cancelAnimationFrame(raf); shown=target; g('lYear').innerHTML=inr(target)+' <span>a year</span>'; },520);
  }
  function calc(src){
    // B can't exceed A, C can't exceed B
    B.max=A.value; if(+B.value>+A.value) B.value=A.value;
    C.max=Math.max(1,B.value); if(+C.value>+B.value) C.value=B.value;
    if(!cTouched && src!==C) C.value=Math.round(B.value/5);
    const a=+A.value,b=+B.value,c=+C.value,d=+D.value;
    g('oA').textContent=a; g('oB').textContent=b; g('oC').textContent=c; g('oD').textContent=inr(d);
    [A,B,C,D].forEach(fill);
    const pct=a?Math.round(b/a*100):0;
    g('lmFill').style.width=pct+'%';
    g('lmText').textContent=pct+'% of your enquiries never got a second follow‑up';
    B.closest('.leak-q').classList.toggle('hot',pct>=30);
    countTo(c*d*12);
    try{ if(src) sessionStorage.setItem('kriyaLeak', a+' enquiries/month, '+b+' not followed up, '+c+' would have bought, avg deal '+inr(d)+', about '+inr(c*d*12)+' a year'); }catch(_){}
    g('lWhy').textContent=a+' enquiries (A). '+b+' never followed up (B). '+c+' of those could have closed (C). '+inr(d)+' average order (D). So '+c+' × '+inr(d)+' × 12.';
    g('cHint').textContent=cTouched?'Your honest guess.':'Set to 1 in every 5 of B until you move it.';
  }
  C.addEventListener('input',()=>{ cTouched=true; });
  [A,B,C,D].forEach(el=>el.addEventListener('input',()=>calc(el)));
  calc();
})();
