// ---------- AI agent demo ----------
(function(){
  const input=document.getElementById('aiInput'), out=document.getElementById('aiOut'), lab=document.getElementById('aiInLab'), run=document.getElementById('aiRun');
  if(!input) return;
  const demos={
    voice:{lab:'You say',
      in:'"Met Sharma ji today, architect, referred by Mehta. Needs a quote for 3 sites. Follow up Friday."',
      out:[['c','Contact captured','Sharma ji · Architect · referred by Mehta'],['n','Note','Needs a quotation for 3 sites'],['t','Task','Follow up with Sharma ji, Friday'],['s','Lead','Marked warm, source: referral']]},
    wa:{lab:'You paste a WhatsApp chat',
      in:'<span class="wa">Hi, need price for 20 units of the 2‑door model</span><span class="wa">Delivery before 15th possible?</span><span class="wa mine">Checking, will revert today</span><span class="wa">Also send brochure pls</span>',
      out:[['s','WhatsApp summary','Wants price for 20 units (2‑door model), delivery before the 15th, asked for a brochure'],['n','Note','Saved on the customer\'s record, with the chat date'],['t','Task','Send quote and brochure today']]},
    rec:{lab:'Inside Mehta Traders\' record, you type',
      in:'<span class="ctx">Mehta Traders · existing customer</span>"Spoke to him. Comparing us with two other vendors. Call back Monday with the revised rate."',
      out:[['n','Note, no duplicate','Added to Mehta Traders: comparing with two other vendors'],['t','Task','Call Mehta Traders Monday with the revised rate'],['s','Status','Quotation stage: negotiating']]}
  };
  const ta=document.getElementById('aiType'), note=document.getElementById('aiNote');
  let cur='voice', timer=null, typer=null;
  function load(k){
    cur=k; clearTimeout(timer); clearInterval(typer);
    document.querySelectorAll('.ai-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
    const own=k==='own';
    input.hidden=own; run.hidden=own; ta.hidden=!own; note.hidden=!own;
    if(own){ lab.textContent='Type any note, the way you would say it'; parse(); ta.focus({preventScroll:true}); return; }
    lab.textContent=demos[k].lab; input.innerHTML=demos[k].in;
    out.innerHTML='<p class="ai-wait">Press run to see it work.</p>'; run.textContent='▶ Run the AI agent';
  }
  const show=cards=>{ out.innerHTML=cards.map((c,i)=>'<div class="ai-card '+c[0]+'" style="animation-delay:'+(i*.25)+'s"><b>'+c[1]+'</b><span>'+c[2]+'</span></div>').join(''); };
  // run: re-type the input live, think, then file the cards
  function go(){
    clearTimeout(timer); clearInterval(typer);
    const html=demos[cur].in, tmp=document.createElement('div'); tmp.innerHTML=html;
    const full=tmp.textContent; let n=0;
    out.innerHTML='<p class="ai-wait">Listening…</p>';
    input.classList.add('ai-caret'); input.textContent='';
    typer=setInterval(()=>{
      n+=2; input.textContent=full.slice(0,n);
      if(n>=full.length){ clearInterval(typer); input.classList.remove('ai-caret'); input.innerHTML=html;
        out.innerHTML='<div class="ai-think"><i></i><i></i><i></i></div>';
        timer=setTimeout(()=>{ show(demos[cur].out); run.textContent='↻ Run again'; },800); }
    },22);
  }
  // simplified live parser for "Try your own"
  const days=['today','tomorrow','monday','tuesday','wednesday','thursday','friday','saturday','sunday','next week'];
  const jobs=['architect','interior designer','designer','contractor','builder','dealer','distributor','retailer','doctor','engineer','consultant','developer','manager','owner','trader'];
  const cap=s=>s.replace(/\b\w/g,m=>m.toUpperCase());
  function parse(){
    const t=ta.value.trim(), lo=t.toLowerCase();
    if(!t){ out.innerHTML='<p class="ai-wait">Start typing. Kriya files it as you go.</p>'; return; }
    const cards=[];
    const nm=t.match(/\b(?:[Mm]et|[Ss]poke to|[Cc]alled|[Mm]eeting with|[Vv]isited by|[Tt]alked to)\s+([A-Z][a-z]+(?:\s+(?!From\b)[A-Z][a-z]+)?(?:\s+ji)?)/) || t.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+ji)?)\b/);
    const job=jobs.find(j=>lo.includes(j));
    const ph=t.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
    const co=t.match(/from\s+([A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,3})/);
    if(nm||ph){ cards.push(['c','Contact captured',[nm&&nm[1],job&&cap(job),co&&co[1]!==(nm&&nm[1])?co[1]:null,ph&&ph[0]].filter(Boolean).join(' · ')]); }
    const need=t.match(/(?:needs?|wants?|looking for|asked for|enquired about|requirement(?: for)?)\s+([^.,]+)/i);
    if(need){ let s=need[1].trim().replace(/\s+(urgently|asap|by|on|call|follow).*$/i,'').replace(/^(a|an|the)\s+/i,''); cards.push(['n','Requirement',s.charAt(0).toUpperCase()+s.slice(1)]); }
    const day=days.find(d=>lo.includes(d));
    if(day) cards.push(['t','Task','Follow up '+(nm?'with '+nm[1]+', ':'')+cap(day)]);
    const hot=/(urgent|asap|immediately|this week|today)/.test(lo), cold=/(just checking|maybe|later|next year|not sure)/.test(lo);
    if(hot||cold) cards.push(['s','Lead temperature',hot?'🔥 Hot, marked urgent':'Cold, check back later']);
    if(!cards.length) cards.push(['n','Note','Saved as a note: "'+t.slice(0,90)+(t.length>90?'…':'')+'"']);
    out.innerHTML=cards.map(c=>'<div class="ai-card live '+c[0]+'"><b>'+c[1]+'</b><span>'+c[2]+'</span></div>').join('');
  }
  ta.addEventListener('input',parse);
  document.querySelectorAll('.ai-tabs button').forEach(b=>b.addEventListener('click',()=>load(b.dataset.k)));
  run.addEventListener('click',go);
  load('voice');
})();
