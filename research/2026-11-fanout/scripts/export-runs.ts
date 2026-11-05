import fs from 'node:fs'; import path from 'node:path';
import { parseTrace, queriesOf, classifyQuery } from '../../../src/fanout/fanout.ts';
const [root='fanout-data/2026-11-05', out='research/2026-11-fanout', termsFile='src/fanout/terms/commercial-uk-100.txt']=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
const vert:Record<string,string>={}; let cur='';
for(const l of fs.readFileSync(termsFile,'utf8').split('\n')){ if(l.startsWith('# ')&&!l.includes('100 UK')&&!l.includes('No years')) cur=l.slice(2).trim(); else if(l.trim()&&!l.startsWith('#')) vert[l.trim()]=cur; }
const runs:any[]=[];
for(const engine of ['claude','codex'] as const){ const d=path.join(root,engine);
 for(const f of fs.readdirSync(d)){ if(!f.endsWith('.meta.json')) continue; const m=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
  const raw=fs.readFileSync(path.join(d,f.replace('.meta.json','.jsonl')),'utf8'); const t=parseTrace(engine,raw,m.term);
  runs.push({engine,term:m.term,vertical:vert[m.term],searchCalls:t.searchCalls.map((c:any)=>c.queries),fetches:t.fetches,pageSearches:t.pageSearches,resultDomains:t.resultDomains,finalText:t.finalText,mcpCalls:raw.split('\n').flatMap((l:string)=>{try{const e=JSON.parse(l);return e.type==='assistant'&&Array.isArray(e.message?.content)?e.message.content.filter((c:any)=>c.type==='tool_use'&&String(c.name).startsWith('mcp__')).map((c:any)=>String(c.name).split('__').pop()):[]}catch{return []}})}); } }
runs.sort((a,b)=>a.term.localeCompare(b.term)||a.engine.localeCompare(b.engine));
fs.writeFileSync(path.join(out,'runs.jsonl'),runs.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log('runs',runs.length, 'bad vertical', runs.filter(r=>!r.vertical).length);
const yr=/\b20\d\d\b/;
const S=(e:string,fn:(r:any)=>boolean)=>{const rs=runs.filter(r=>r.engine===e&&fn(r));const qs=rs.flatMap(r=>r.searchCalls.flat());return {runs:rs.length,qPerRun:+(qs.length/rs.length).toFixed(1),fetchPerRun:+(rs.reduce((a,r)=>a+r.fetches.length,0)/rs.length).toFixed(1),yearShare:+(qs.filter((q:string)=>yr.test(q)).length/qs.length).toFixed(2),firstHasYear:+(rs.filter(r=>yr.test((r.searchCalls[0]||[]).join(' '))).length/rs.length).toFixed(2)}};
const isBest=(r:any)=>/^best\b/.test(r.term);
for(const e of ['claude','codex']) console.log(e,'best',S(e,isBest),'notbest',S(e,r=>!isBest(r)));
console.log('notbest terms',[...new Set(runs.filter(r=>!isBest(r)).map(r=>r.term))]);
// listicle scepticism + stale catches in answers
const rx=/affiliate|commission|ranks itself|self-rank|vendor-run|sells (its|their) own|written by the (compan|firm|broker)|marketing page|no independent/i;
for(const e of ['claude','codex']){const rs=runs.filter(r=>r.engine===e);console.log(e,'answers flagging bias',rs.filter(r=>rx.test(r.finalText||'')).length,'no-independent',rs.filter(r=>/no (single )?independent|couldn.t find an independent|no current independent/i.test(r.finalText||'')).length,'mean answer words',Math.round(rs.reduce((a,r)=>a+(r.finalText||'').split(/\s+/).length,0)/rs.length));}
// claude opened domains by vertical
const dom=(u:string)=>{try{return new URL(u).hostname.replace(/^www\.|^uk\./,'')}catch{return ''}};
for(const v of ['Legal & professional','Health & wellness','Home services & property','Education & careers','Money & finance','Software / SaaS','Consumer products']){const c:Record<string,number>={};for(const r of runs.filter(r=>r.engine==='claude'&&r.vertical===v))for(const d of new Set(r.fetches.map(dom)) as Set<string>)c[d]=(c[d]||0)+1;console.log(v,Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]+':'+x[1]).join(' '));}
// codex site: intents
const cq=runs.filter(r=>r.engine==='codex').flatMap(r=>r.searchCalls.flat() as string[]).filter(q=>/site[:.]/i.test(q));
const b=(re:RegExp)=>cq.filter(q=>re.test(q)).length;
console.log('codex site q',cq.length,'price',b(/pric|fee|cost|£|per month|tariff/i),'review',b(/review|rating|trustpilot/i),'contact',b(/contact|address|office|phone/i),'register',b(/regist|accredit|certif|licen|inspect/i));
for(const e of ['claude','codex']){console.log('--',e);for(const q of runs.find(r=>r.engine===e&&r.term==='best seo agency in london for fmcg')?.searchCalls.flat()||[])console.log(q);}
