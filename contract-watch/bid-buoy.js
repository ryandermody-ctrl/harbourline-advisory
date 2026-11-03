/* Bid Buoy browser UI. Input text stays local; only the user can choose to share anonymized outcome. */
(function(){
 'use strict';
 const E=window.BidBuoy;if(!E)return;
 const $=(id)=>document.getElementById(id);
 const elements={questions:$('question-grid'),text:$('tender-text'),report:$('report'),scan:$('clause-results'),status:$('status'),form:$('gate-form')};
 const choices=['Verified','Uncertain','Gap'];
 const meta=[{key:'vessel',note:'Class, flag, crewing, equipment and vessel availability'},
  {key:'mobilization',note:'Transit, port access, weather, schedule and cost'},
  {key:'mandatory',note:'Pass/fail requirements and evidence'},
  {key:'scope',note:'Relevant projects, resources and methods'},
  {key:'commercial',note:'Insurance, payment, indemnity and margin'},
  {key:'bidtime',note:'Deadline, tender addenda and bid team readiness'}];
 const questions=meta.map(q=>E.QUESTIONS.find(x=>x.id===q.key));
 function mk(tag,cls,value){const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=value;return x;}
 function el(tag,attrs){const x=document.createElement(tag);Object.entries(attrs||{}).forEach(([k,v])=>x.setAttribute(k,v));return x;}
 for(const [i,q] of questions.entries()){
  const box=mk('fieldset','gate-question');
  const legend=mk('legend','question-title',(i+1<10?'0':'')+(i+1)+'  '+q.title);box.append(legend);
  const note=mk('p','question-note',meta[i].note);box.append(note);
  const opts=mk('div','segmented');
  q.choices.forEach((text,j)=>{
   const val=String(2-j),id=`q_${q.id}_${val}`;
   const label=mk('label','choice');const input=el('input',{type:'radio',name:q.id,value:val,id:id,required:'required'});
   const span=mk('span','',text);label.append(input,span);opts.append(label);
  });
  box.append(opts);elements.questions.append(box);
 }
 const sample=`ILLUSTRATIVE EXAMPLE ONLY - this is NOT a real tender notice.\n\nThe contractor shall provide a Canadian-flagged vessel with a valid load line certificate and a safe manning document. Attendance at the mandatory site visit is required. The contractor shall provide a performance bond before work commences. Marine liability insurance and P&I cover are required. Liquidated damages of $2,000 per day apply to delayed completion. Mobilization and demobilization are included in the fixed lump sum price. All addenda must be acknowledged. Submission via the portal is required.`;
 function getAnswers(){const data=new FormData(elements.form);const out={};E.QUESTIONS.forEach(q=>{out[q.id]=data.get(q.id);});return out;}
 let current=null;
 function scoreText(r){return r.score===null?'—':String(r.score)+' / 100';}
 function stateText(r,scan){
   if(r.status==='STOP') return {word:'STOP: requirement missing',hint:'One of your answers suggests a requirement you cannot meet. Resolve that before pricing.'};
   if(r.status==='HOLD') return {word:'HOLD: questions remain',hint:'Some answers are still uncertain. Put names against the questions below.'};
   if(scan.counts.critical) return {word:'CHECK THESE CONTRACT TERMS',hint:'Your answers show no hard stop, but the pasted section contains wording that needs a closer look.'};
   return {word:'READY FOR A CLOSER LOOK',hint:'No hard stop appeared in your answers. Read the full tender and check the documents before bidding.'};
 }
 function addActions(r,scan){
   const actions=[...r.actions];
   scan.flags.forEach(f=>{if(!actions.includes(f.question))actions.push(f.question);});
   if(!actions.length)actions.push('Re-read the complete solicitation, confirm all amendments and keep a signed go/no-go decision record.');
   return actions.slice(0,15);
 }
 function renderResults(r,scan,burn){
   const t=stateText(r,scan);elements.report.replaceChildren();
   const top=mk('div','report-top');
   const label=mk('p','eyebrow','YOUR CHECKLIST RESULTS');
   const heading=mk('h2','report-heading',t.word);
   const caption=mk('p','lead',t.hint);top.append(label,heading,caption);
   const stats=mk('div','report-stats');
   [[scoreText(r),'Self-rated readiness'],[String(scan.counts.critical),'Urgent checks'],[String(scan.counts.review),'Other checks'],[burn===null?'—':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(burn),'Bid writing cost']].forEach(row=>{
    const b=mk('div','stat');b.append(mk('strong','',row[0]),mk('small','',row[1]));stats.append(b);
   });top.append(stats);elements.report.append(top);
   const cols=mk('div','report-columns');
   const hard=mk('section','report-panel');hard.append(mk('h3','',r.hardStops.length?'Must resolve before bidding':'Questions to settle'));
   const list=mk('ol','action-list');const actions=addActions(r,scan);actions.forEach(text=>list.append(mk('li','',text)));hard.append(list);
   const facts=mk('section','report-panel');facts.append(mk('h3','','Contract wording check'));
   const line=mk('p','muted',scan.reviewedChars?`Checked ${scan.reviewedChars.toLocaleString()} characters in this browser; ${scan.flags.length} possible clauses found.`:'No tender text provided. The clause scan was skipped.');facts.append(line);
   if(scan.truncated)facts.append(mk('p','flag warning','Text was limited to the first 100,000 characters.'));
   facts.append(mk('p','small','Patterns highlight topics; they do not determine whether a requirement applies. Exact wording, exceptions and attachments must be checked.'));
   cols.append(hard,facts);elements.report.append(cols);
   const toolbar=mk('div','report-actions');
   const share=el('button',{type:'button',class:'btn primary'});share.textContent='Copy link for operations';share.addEventListener('click',shareReport);
   const copy=el('button',{type:'button',class:'btn alt'});copy.textContent='Copy what needs checking';copy.addEventListener('click',()=>copyText(actions.map((a,i)=>`${i+1}. ${a}`).join('\n'),'Action list copied.'));
   const png=el('button',{type:'button',class:'btn alt'});png.textContent='Save summary image';png.addEventListener('click',downloadCard);
   const print=el('button',{type:'button',class:'btn alt'});print.textContent='Print or save PDF';print.addEventListener('click',()=>window.print());
   toolbar.append(share,png,copy,print);elements.report.append(toolbar);
   elements.report.hidden=false;
   elements.report.scrollIntoView({behavior:'smooth',block:'start'});
   $('report-live').textContent='Results ready. '+t.word+'.';
   current={r,scan,burn,actions};
 }
 async function copyText(value,success){
  try{
   if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);
   else{const tmp=el('textarea');tmp.value=value;tmp.style.position='fixed';tmp.style.left='-9999px';document.body.append(tmp);tmp.select();const ok=document.execCommand('copy');tmp.remove();if(!ok)throw Error('copy failed');}
   $('copy-status').textContent=success;
  }catch(e){$('copy-status').textContent='Clipboard unavailable. Select and copy the address from your browser instead.';}
 }
 function formatCard(){
   if(!current)return '';
   const p=E.sharePayload(current.r,current.scan);
   const label=p.s==='STOP'?'STOP / mandatory or operational gate':p.s==='HOLD'?'HOLD / open evidence':'REVIEW / full review recommended';
   return ['BID BUOY / HARBOUR LINE ADVISORY','Anonymous marine bid desk check','Decision: '+label,'Readiness: '+p.p+'/100','Critical clause topics: '+p.r,'Other clause topics: '+p.a,'This is a self-reported screening heuristic, not compliance advice.','No tender text, client name or bid cost included.'].join('\n');
 }
 function shareReport(){if(!current)return;
  const p=E.sharePayload(current.r,current.scan);
  const domain=window.location.hostname.toLowerCase();
  if(domain==='harbourlineadvisory.com'||domain.endsWith('.harbourlineadvisory.com')){
   const url=new URL('bid-buoy.html',window.location.href);
   url.searchParams.set('card',encodeURIComponent(JSON.stringify(p)));
   copyText(url.href,'Anonymous team-review link copied. No tender text, company name or pricing included.');
  }else{
   copyText(formatCard(),'Anonymous text card copied. A shareable website link will become available after the company-branded domain is connected.');
  }
 }
 function downloadCard(){
  if(!current)return;
  const p=E.sharePayload(current.r,current.scan);
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;
  const c=canvas.getContext('2d');if(!c)return;
  c.fillStyle='#13263a';c.fillRect(0,0,1200,630);
  c.fillStyle='#f4b38b';c.fillRect(78,85,80,7);
  c.fillStyle='#efb992';c.font='bold 25px system-ui, sans-serif';c.fillText('COASTAL CONTRACT WATCH',78,144);
  c.fillStyle='#eef5ef';c.font='bold 57px Georgia,serif';c.fillText(p.s==='STOP'?'STOP / HARD GATE':p.s==='HOLD'?'HOLD: questions remain':'PROCEED TO REVIEW',78,250);
  c.fillStyle='#cfdee1';c.font='25px system-ui, sans-serif';c.fillText('Marine contract desk check / self-reported assessment',78,295);
  c.fillStyle='#d7f0dc';c.font='bold 89px system-ui, sans-serif';c.fillText(p.p+' / 100',78,420);
  c.fillStyle='#cfdee1';c.font='22px system-ui, sans-serif';c.fillText('Answers checked',80,455);
  c.fillText(p.r+' critical topics   ·   '+p.a+' review topics',78,515);
  c.fillStyle='#96aab6';c.font='17px system-ui, sans-serif';c.fillText('No tender text or pricing shared. Review the official requirements.',78,565);
  c.fillText('BID BUOY  ·  HARBOUR LINE ADVISORY',78,600);
  const a=document.createElement('a');a.download='bid-buoy-anonymous-review.png';a.href=canvas.toDataURL('image/png');document.body.append(a);a.click();a.remove();
  $('copy-status').textContent='Anonymous share image generated in your browser. It contains no tender text or bid cost.';
 }
 function buildFlags(scan){
  elements.scan.replaceChildren();
  if(!scan.reviewedChars){elements.scan.append(mk('p','small','Paste a public tender clause above if you want to check for common risk wording.'));return;}
  if(!scan.flags.length){elements.scan.append(mk('p','empty-scan','No configured keyword patterns found in this excerpt. This is not a clean bill of health.'));return;}
  scan.flags.forEach(f=>{
    const card=mk('article','signal');
    const head=mk('div','signal-head');head.append(mk('strong','',f.label),mk('span','risk-tag '+(f.severity==='critical'?'risk-red':'risk-amber'),f.severity==='critical'?'Critical review':'Review'));
    const quote=mk('p','signal-excerpt','Found: '+f.context);
    const question=mk('p','','Ask: '+f.question);
    card.append(head,quote,question);elements.scan.append(card);
  });
 }
 function budget(){const hours=Number($('hours').value),rate=Number($('rate').value),third=Number($('third').value);
  if(!Number.isFinite(hours)||!Number.isFinite(rate)||!Number.isFinite(third)||hours<0||rate<0||third<0||hours>100000||rate>100000||third>10000000)return null;
  return Math.round(hours*rate+third);
 }
 elements.form.addEventListener('submit',ev=>{ev.preventDefault();const r=E.evaluate(getAnswers());
  if(r.status==='INCOMPLETE'){$('form-error').textContent='Please answer all six readiness questions before producing a review.';$('form-error').hidden=false;return;}
  $('form-error').hidden=true;
  const s=E.scan(elements.text.value);buildFlags(s);renderResults(r,s,budget());
 });
 $('demo-btn').addEventListener('click',()=>{elements.text.value=sample;const values=[2,1,2,2,1,2];questions.forEach((q,i)=>{const input=elements.form.querySelector(`input[name="${q.id}"][value="${values[i]}"]`);if(input)input.checked=true;});$('hours').value=34;$('rate').value=95;$('third').value=1200;$('copy-status').textContent='Example loaded. Select Show my results.';});
 $('clear-btn').addEventListener('click',()=>{elements.form.reset();elements.text.value='';elements.report.hidden=true;elements.scan.replaceChildren();$('share-preview').hidden=true;current=null;$('copy-status').textContent='';$('form-error').hidden=true;});
 const qp=new URLSearchParams(window.location.search);
 if(qp.has('card')){
  const p=E.decodePayload(qp.get('card'));
  if(p){const pre=$('share-preview');pre.hidden=false;pre.replaceChildren();pre.append(mk('p','eyebrow','SUMMARY FROM A COLLEAGUE'),mk('h2','',p.s==='STOP'?'A hard gate needs attention':p.s==='HOLD'?'Hold pending evidence':'Ready for full review'),mk('p','lead',`Reported readiness index: ${p.p}/100 · Urgent checks: ${p.r} · Other checks: ${p.a}.`),mk('p','small','This anonymous card was created by another user. No underlying tender or answers are included. Scores reflect supplied answers only and are not independently verified.'));
   const a=el('a',{href:'bid-buoy.html',class:'btn'});a.textContent='Screen your own contract';pre.append(a);
   pre.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
})();