/* Bid Buoy: transparent local-only bid-screening heuristics.
   Copyright Harbour Line Advisory 2026. No external AI endpoint or network call.
   This is a preliminary risk checklist, not legal/insurance/technical advice. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BidBuoy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var QUESTIONS = [
    {id:'mandatory', title:'Mandatory eligibility and certifications', weight:24, hard:true,
     choices:['Evidence checked: yes','Not yet checked','Known mandatory gap'], action:'Compare every pass/fail criterion against the official solicitation and supporting documents.'},
    {id:'vessel', title:'Vessel, crew, class and equipment readiness', weight:20, hard:true,
     choices:['Ready and evidenced','Partner or evidence needed','Cannot supply the required asset'], action:'Confirm vessel availability, class/flag, crewing, certification and equipment against the actual scope.'},
    {id:'mobilization', title:'Mobilization and site access', weight:18, hard:true,
     choices:['Feasible, costed and scheduled','Restrictions unresolved','Not feasible by required start'], action:'Prove transit and mobilization time, berth access, weather windows and logistics cost.'},
    {id:'scope', title:'Experience and delivery fit', weight:12, hard:false,
     choices:['Proven work type','Adjacent capability','Material stretch'], action:'Match past performance to stated technical evaluation criteria, not merely similar projects.'},
    {id:'commercial', title:'Cash flow, pricing and contract downside', weight:15, hard:false,
     choices:['Costed with acceptable downside','Pricing or terms unresolved','Unacceptable exposure'], action:'Stress-test payment timing, fuel, change orders, penalties, indemnity and working capital.'},
    {id:'bidtime', title:'Submission runway and approval time', weight:11, hard:true,
     choices:['Bid team and runway confirmed','Tight or approval pending','Cannot submit compliantly'], action:'Confirm the official closing date, time zone, portal, required attachments and addenda.'}
  ];
  var CLAUSES = [
    {id:'set_aside',group:'Eligibility',severity:'critical',label:'Restricted supplier eligibility',pattern:/\b(?:set[\s-]?aside\s+(?:under|for)|procurement\s+strategy\s+for\s+indigenous\s+business|indigenous\s+business\s+directory)\b/i,question:'Is the intended bidder legally eligible, and can it produce the required evidence?'},
    {id:'mandatory_meeting',group:'Eligibility',severity:'critical',label:'Mandatory site visit or briefing',pattern:/\b(?:mandatory|compulsory|required)\s+(?:site\s+visit|pre[\s-]?bid\s+(?:meeting|briefing)|information\s+session)\b/i,question:'Has the designated attendee registered and attended before the cut-off?'},
    {id:'security',group:'Eligibility',severity:'critical',label:'Security clearance',pattern:/\b(?:reliability\s+status|secret\s+clearance|security\s+clearance|personnel\s+security\s+screening)\b/i,question:'Can all required persons and facilities prove valid clearances in time?'},
    {id:'experience',group:'Eligibility',severity:'review',label:'Past-performance threshold',pattern:/\b(?:minimum\s+(?:of\s+)?\d+\s+years\s+of\s+experience|similar\s+contracts?\s+within\s+the\s+last|reference\s+projects?\s+(?:must|shall))\b/i,question:'Do projects, evidence and client references meet the stated threshold exactly?'},
    {id:'bid_bond',group:'Eligibility',severity:'critical',label:'Bid or performance security',pattern:/\b(?:bid\s+bond|bid\s+security|performance\s+bond|contract\s+security|surety\s+bond)\b/i,question:'Has the surety confirmed required wording, amount, time and cost?'},
    {id:'insurance',group:'Commercial',severity:'review',label:'Insurance requirement',pattern:/\b(?:protection\s+and\s+indemnity|\bp\s*&\s*i\b|marine\s+liability\s+insurance|commercial\s+general\s+liability|additional\s+insured)\b/i,question:'Will the broker confirm the exact cover, limits and named-insured wording?'},
    {id:'uncapped_liability',group:'Commercial',severity:'critical',label:'Potentially uncapped liability',pattern:/\b(?:unlimited\s+liability|liability\s+(?:shall\s+)?not\s+be\s+limited|without\s+limitation\s+of\s+liability)\b/i,question:'Can legal counsel confirm the full cap, exclusions and insurability of this exposure?'},
    {id:'liquidated',group:'Commercial',severity:'review',label:'Liquidated damages or delay penalties',pattern:/\b(?:liquidated\s+damages|delay\s+damages|penalt(?:y|ies)\s+per\s+day)\b/i,question:'Has the exposure been costed against realistic delay and weather scenarios?'},
    {id:'indemnity',group:'Commercial',severity:'review',label:'Indemnification or hold-harmless clause',pattern:/\b(?:indemnif(?:y|ication)|hold\s+harmless|defend\s+and\s+indemnify)\b/i,question:'Does this extend beyond fault, insurance or the subcontractor chain?'},
    {id:'termination',group:'Commercial',severity:'review',label:'Termination for convenience',pattern:/\b(?:termination\s+for\s+convenience|terminate\s+(?:this\s+)?contract\s+for\s+convenience)\b/i,question:'Will unrecovered mobilization, demobilization and committed vessel time be compensated?'},
    {id:'firm_price',group:'Commercial',severity:'review',label:'Fixed-price or price-escalation risk',pattern:/\b(?:firm\s+fixed\s+price|fixed\s+lump\s+sum|no\s+price\s+escalation|all[-\s]inclusive\s+price)\b/i,question:'Are fuel, port dues, weather downtime and vessel charter costs protected?'},
    {id:'retention',group:'Commercial',severity:'review',label:'Retention or delayed payment',pattern:/\b(?:retainage|retention\s+money|payment\s+within\s+(?:60|90|120)\s+days|net\s+(?:60|90|120)\b)\b/i,question:'Can working capital carry crew, fuel, suppliers and equipment before receipt?'},
    {id:'class_flag',group:'Marine operations',severity:'critical',label:'Vessel class, flag or certification requirement',pattern:/\b(?:class(?:ed|ification)\s+(?:society|certificate|requirements?)|canadian[-\s]flagged|flag[-\s]state|load\s+line\s+certificate|passenger\s+vessel\s+safety\s+certificate)\b/i,question:'Can the actual named vessel meet this requirement for the entire charter?'},
    {id:'safe_manning',group:'Marine operations',severity:'critical',label:'Crew or safe-manning requirement',pattern:/\b(?:safe\s+manning|minimum\s+safe\s+crewing|marine\s+personnel\s+regulations|crew\s+certificat(?:e|ion))\b/i,question:'Are crew numbers, certificates, watchkeeping and fatigue limits compatible with the operating plan?'},
    {id:'dp_ice',group:'Marine operations',severity:'critical',label:'Special vessel capability',pattern:/\b(?:\bdp\s*[12]\b|dynamic\s+positioning|ice\s+class|icebreaker|anchor\s+handling|bollard\s+pull|minimum\s+draft|maximum\s+draft)\b/i,question:'Is the specified vessel capability supported by documents and performance limits?'},
    {id:'access',group:'Marine operations',severity:'review',label:'Port access, permits or pilotage',pattern:/\b(?:pilotage\s+compulsory|port\s+authority\s+permit|dredging\s+permit|environmental\s+permit|marine\s+mammal\s+observer|berth\s+availability)\b/i,question:'Are permissions, port restrictions, environmental requirements and access windows confirmed?'},
    {id:'weather',group:'Marine operations',severity:'review',label:'Weather-window or seasonal exposure',pattern:/\b(?:weather\s+window|weather\s+downtime|sea\s+state|significant\s+wave\s+height|seasonal\s+closure)\b/i,question:'Does the schedule include realistic weather contingency and standby allocation?'},
    {id:'mobil_cost',group:'Marine operations',severity:'review',label:'Mobilization or demobilization costs',pattern:/\b(?:mobiliz(?:ation|e)|demobiliz(?:ation|e)|tow\s+to\s+site)\b/i,question:'Are transit, crew changes, towing, bunkers, docking and return voyage all priced?'},
    {id:'addenda',group:'Bid process',severity:'review',label:'Addenda acknowledgement',pattern:/\b(?:acknowledg(?:e|ement)\s+(?:all\s+)?addend(?:a|um)|all\s+amendments\s+must\s+be\s+acknowledged)\b/i,question:'Who will check the official portal for last-minute addenda and prove acknowledgement?'},
    {id:'portal',group:'Bid process',severity:'review',label:'Portal submission or original documents',pattern:/\b(?:electronic\s+bid\s+submission|submit\s+via\s+(?:the\s+)?(?:portal|bcbid|ariba)|sealed\s+tender)\b/i,question:'Is the supplier account verified and is an internal submission cut-off scheduled?'},
    {id:'questions',group:'Bid process',severity:'review',label:'Pre-bid questions deadline',pattern:/\b(?:deadline\s+for\s+questions|questions?\s+must\s+be\s+(?:submitted|received)|enquir(?:y|ies)\s+deadline)\b/i,question:'Are all material clarifications submitted before the question deadline?'}
  ];
  function evaluate(answers) {
    answers = answers || {};
    var unknown = QUESTIONS.filter(q => !['0','1','2'].includes(String(answers[q.id])));
    if (unknown.length) return {status:'INCOMPLETE',score:null,missing:unknown.map(q=>q.title),hardStops:[],watch:[],actions:[]};
    var score = 0, hardStops = [], watch = [], actions = [];
    QUESTIONS.forEach(q => {
      var v=Number(answers[q.id]);
      score += q.weight * v/2;
      if(q.hard && v===0){hardStops.push(q.title);actions.push(q.action);}
      else if(v<2){watch.push(q.title);actions.push(q.action);}
    });
    score=Math.round(score);
    var status=hardStops.length?'STOP':(watch.length ? 'HOLD' : 'REVIEW');
    return {status,score,missing:[],hardStops,watch,actions};
  }
  function scan(text) {
    var raw = String(text || '').slice(0,100000);
    var flattened = raw.replace(/\s+/g,' ');
    var flags = [];
    CLAUSES.forEach(c => {
      var m=c.pattern.exec(flattened);
      if(!m) return;
      var p=m.index;
      var near=flattened.slice(Math.max(0,p-44),Math.min(flattened.length,p+m[0].length+70));
      flags.push({id:c.id,group:c.group,severity:c.severity,label:c.label,question:c.question,phrase:m[0],context:near});
    });
    var counts={critical:flags.filter(f=>f.severity==='critical').length,review:flags.filter(f=>f.severity==='review').length};
    return {flags,counts,reviewedChars:raw.length,truncated:String(text||'').length>100000,disclaimer:'Keyword patterns only. Negations, exceptions, contract definitions and document attachments require human review. Missing a flag does not mean a clause is absent.'};
  }
  function sharePayload(evaluation,scanResult) {
    if(!evaluation||evaluation.status==='INCOMPLETE') return null;
    var groups = [...new Set((scanResult?.flags||[]).map(f=>f.group))];
    return {v:1,s:evaluation.status,p:evaluation.score,r:scanResult?.counts?.critical||0,a:scanResult?.counts?.review||0,g:groups.filter(x=>['Eligibility','Commercial','Marine operations','Bid process'].includes(x)).slice(0,4)};
  }
  function decodePayload(raw) {
    try{
      if(typeof raw!=='string'||raw.length>900) return null;
      var x=JSON.parse(decodeURIComponent(raw));
      if(x.v!==1||!['STOP','HOLD','REVIEW'].includes(x.s)||!Number.isInteger(x.p)||x.p<0||x.p>100) return null;
      x.r=Math.max(0,Math.min(30,Number(x.r)||0));x.a=Math.max(0,Math.min(30,Number(x.a)||0));
      x.g=Array.isArray(x.g)?x.g.filter(z=>['Eligibility','Commercial','Marine operations','Bid process'].includes(z)).slice(0,4):[];
      return x;
    }catch(e){return null;}
  }
  return {QUESTIONS,CLAUSES,evaluate,scan,sharePayload,decodePayload};
});