export {};
// Find ESPN slugs for the English domestic cups.
const B = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
async function g(u: string): Promise<any | null> {
  await new Promise(r => setTimeout(r, 400));
  try { const r = await fetch(u, { headers: H }); return r.ok ? await r.json() : null; } catch { return null; }
}
const CANDIDATES = ['eng.fa', 'eng.league_cup', 'eng.charity', 'eng.worthington',
                    'eng.fa_cup', 'eng.efl_cup', 'eng.trophy'];
for (const slug of CANDIDATES) {
  const d = await g(`${B}/${slug}/teams`);
  if (!d) { console.log(`SLUG ${slug}: no response`); continue; }
  for (const s of d.sports ?? []) for (const l of s.leagues ?? []) {
    const names = (l.teams ?? []).map((t: any) => String(t.team?.displayName));
    const ours = names.filter((n: string) => ['Manchester United','Arsenal','Liverpool','Tottenham','Brighton']
      .some(o => n.includes(o)));
    console.log(`SLUG ${slug}: name="${l.name}" year=${l.year} teams=${names.length} ours=${ours.join('/') || 'none'}`);
  }
}
// And do fixtures actually come back for a club in the FA Cup?
for (const slug of ['eng.fa', 'eng.league_cup']) {
  for (const [nm, id] of [['ManUtd','360'], ['Arsenal','359']]) {
    const a = await g(`${B}/${slug}/teams/${id}/schedule`);
    const b = await g(`${B}/${slug}/teams/${id}/schedule?fixture=true`);
    console.log(`FIX ${slug} ${nm}: past=${(a?.events ?? []).length} upcoming=${(b?.events ?? []).length}`);
  }
}
