// Compares the commercial and informational batches, per engine. Run from the repo root.
import fs from 'node:fs';
const load=(f)=>fs.readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l));
const base='research/2026-11-fanout';
const sets={commercial:load(`${base}/runs.jsonl`),informational:load(`${base}/informational/runs.jsonl`)};
const yr=/\b20\d\d\b/, scoped=/\bsite[:.]([a-z0-9-]+\.)+[a-z]{2,}/i;
const scopedDomain=(q)=>[...q.matchAll(/\bsite[:.]((?:[a-z0-9-]+\.)+[a-z]{2,})/gi)].map(m=>m[1].toLowerCase().replace(/^www\./,''));
const med=(a)=>{const s=[...a].sort((x,y)=>x-y);const n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2};
const mean=(a)=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
const dom=(u)=>{try{return new URL(u).hostname.replace(/^www\.|^uk\./,'')}catch{return ''}};
const auth=/(^|\.)(gov\.uk|nhs\.uk|ac\.uk|sch\.uk|police\.uk|org\.uk|gov|edu)$|ofgem|ofcom|ofsted|cqc|fca\.org|acas|citizensadvice|moneyhelper|which\.co|trustpilot|chambers|legal500|wikipedia|europa\.eu|who\.int|nih\.gov/i;
const bias=/affiliate|commission|ranks itself|self-rank|vendor-run|sells (its|their) own|written by the (compan|firm|broker)|marketing page|no independent/i;
const out={};
for(const [name,runs] of Object.entries(sets)) for(const e of ['claude','codex']){
  const rs=runs.filter(r=>r.engine===e), qs=rs.map(r=>r.searchCalls.flat());
  const all=qs.flat(), sq=all.filter(q=>scoped.test(q)), sd=sq.flatMap(scopedDomain);
  const count=(xs)=>{const c={};for(const x of xs)c[x]=(c[x]||0)+1;return Object.entries(c).sort((a,b)=>b[1]-a[1])};
  out[`${name}/${e}`]={
    runs:rs.length, qPerRun:mean(qs.map(q=>q.length)), qMedian:med(qs.map(q=>q.length)), qMax:Math.max(...qs.map(q=>q.length)),
    callsPerRun:mean(rs.map(r=>r.searchCalls.length)),
    fetchPerRun:mean(rs.map(r=>r.fetches.length)), fetchMedian:med(rs.map(r=>r.fetches.length)), noFetchRuns:rs.filter(r=>!r.fetches.length).length,
    yearQueryPct:Math.round(100*all.filter(q=>yr.test(q)).length/all.length),
    runsAnyYearPct:Math.round(100*rs.filter(r=>r.searchCalls.flat().some(q=>yr.test(q))).length/rs.length),
    runsFirstYearPct:Math.round(100*rs.filter(r=>yr.test((r.searchCalls[0]||[]).join(' '))).length/rs.length),
    runsScopedPct:Math.round(100*rs.filter(r=>r.searchCalls.flat().some(q=>scoped.test(q))).length/rs.length),
    scopedQueryPct:Math.round(100*sq.length/all.length), scopedQueries:sq.length, scopedDomains:new Set(sd).size,
    scopedAuthPct:sd.length?Math.round(100*sd.filter(d=>auth.test(d)).length/sd.length):0,
    topScoped:count(sd).slice(0,12).map(x=>x.join(':')).join(' '),
    openedAuthPct:(()=>{const d=rs.flatMap(r=>[...new Set(r.fetches.map(dom))]);return d.length?Math.round(100*d.filter(x=>auth.test(x)).length/d.length):0})(),
    topOpened:count(rs.flatMap(r=>[...new Set(r.fetches.map(dom))])).slice(0,12).map(x=>x.join(':')).join(' '),
    mcpRuns:rs.filter(r=>(r.mcpCalls||[]).some(m=>m!=='update_plan'&&m!=='wrap_up')).length,
    answerWords:Math.round(mean(rs.map(r=>(r.finalText||'').split(/\s+/).length))),
    biasPct:Math.round(100*rs.filter(r=>bias.test(r.finalText||'')).length/rs.length),
  };
}
console.log(JSON.stringify(out,null,1));
// Per-vertical, informational only
const inf=sets.informational;
for(const e of ['claude','codex']){console.log('--',e);for(const v of [...new Set(inf.map(r=>r.vertical))]){const rs=inf.filter(r=>r.engine===e&&r.vertical===v);console.log(v,mean(rs.map(r=>r.searchCalls.flat().length)),mean(rs.map(r=>r.fetches.length)))}}
// Non-"best" commercial terms
for(const e of ['claude','codex']){const rs=sets.commercial.filter(r=>r.engine===e&&!/^best\b/.test(r.term));console.log('non-best commercial',e,rs.length,mean(rs.map(r=>r.searchCalls.flat().length)),mean(rs.map(r=>r.fetches.length)))}
// Answer wording, by keyword match
const broad=/affiliate|commission|vendor|retailer|promotional|they sell|who sell|that sell|sells |sell these|have an interest|has an interest|commercial (site|guide|source)|marketing|no independent/i;
const snippet=/search (result )?(summar|excerpt|snippet)|didn.t open|did not open/i;
const blocked=/\b403\b|\b404\b|blocked|wouldn.t open|couldn.t open|could not open|couldn.t retrieve|returned no usable/i;
for(const [n,S] of Object.entries(sets))for(const e of ['claude','codex']){const r=S.filter(x=>x.engine===e);const pct=(re)=>Math.round(100*r.filter(x=>re.test(x.finalText||'')).length/r.length);console.log(n,e,'flags commercial sources',pct(broad)+'%','relied on summaries',pct(snippet)+'%','says a page failed',pct(blocked)+'%','term names uk',r.filter(x=>/\buk\b/i.test(x.term)).length+'/'+r.length)}
// Hand classification of the informational Codex domain-scoped queries: companies; everything else is official, public or professional
const companies=new Set('help.klaviyo.com bupa.co.uk worcester-bosch.co.uk bbcgoodfood.com philips.com nationwide.co.uk halifax.co.uk mailchimp.com bose.com sony.com aviva.co.uk geotab.com tesla.com eurostar.com support.google.com wordstream.com business.google.com rei.com skischool.co.uk whistlerblackcomb.com developers.google.com ahrefs.com salesforce.com hubspot.com vodafone.co.uk vaillant.co.uk idealheating.com'.split(' '));
const ds=inf.filter(r=>r.engine==='codex').flatMap(r=>r.searchCalls.flat().flatMap(scopedDomain));console.log('informational codex scoped',ds.length,'to companies',ds.filter(d=>companies.has(d)).length);
// Which runs used a year
for(const t of [...new Set(inf.map(r=>r.term))]){const f=(e)=>{const q=inf.find(r=>r.term===t&&r.engine===e).searchCalls.flat();return q.filter(x=>yr.test(x)).length+'/'+q.length};console.log(t,'| claude',f('claude'),'| codex',f('codex'))}
// Query lists
for(const e of ['claude','codex'])for(const r of inf.filter(r=>r.engine===e&&/heat pump|sim only|car leasing|what is a crm|private health/.test(r.term))){console.log('\n',e,'|',r.term);for(const q of r.searchCalls.flat())console.log('  ',q)}
