import fs from 'node:fs';
const [termsFile, qFile, rep] = process.argv.slice(2);
const vert = {}; let cur = '';
for (const l of fs.readFileSync(termsFile,'utf8').split('\n')) {
  if (l.startsWith('# ') && !l.includes('100 UK') && !l.includes('No years')) cur = l.slice(2).trim();
  else if (l.trim() && !l.startsWith('#')) vert[l.trim()] = cur;
}
const qs = fs.readFileSync(qFile,'utf8').trim().split('\n').map(JSON.parse);
const R = JSON.parse(fs.readFileSync(rep,'utf8'));
const agg = {}; const years = {claude:{},codex:{}}; let month={claude:0,codex:0}, tot={claude:0,codex:0};
for (const q of qs) {
  const k = vert[q.term]+'|'+q.engine; agg[k] ??= {q:0,y:0,site:0,terms:new Set()};
  const a=agg[k]; a.q++; a.terms.add(q.term); if (q.year) a.y++; if (q.labels.includes('site-scoped')) a.site++;
  for (const m of q.query.match(/\b20\d\d\b/g)||[]) years[q.engine][m]=(years[q.engine][m]||0)+1;
  tot[q.engine]++; if (/\b(november|october|autumn|winter|black friday)\b/i.test(q.query)) month[q.engine]++;
}
console.log('years', JSON.stringify(years)); console.log('month/season words', month, tot);
const vs=[...new Set(Object.values(vert))];
console.log('vertical | claude q/run | claude %year | codex q/run | codex %year | codex %site');
for (const v of vs){const c=agg[v+'|claude'],x=agg[v+'|codex'];
 console.log(`${v} | ${(c.q/10).toFixed(1)} | ${Math.round(100*c.y/c.q)}% | ${(x.q/10).toFixed(1)} | ${Math.round(100*x.y/x.q)}% | ${Math.round(100*x.site/x.q)}%`);}
console.log(Object.keys(R));
