export {};
// Find Morocco's ESPN team id and the competitions carrying their fixtures.
const B = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
async function g(u: string): Promise<any | null> {
  await new Promise(r => setTimeout(r, 400));
  try { const r = await fetch(u, { headers: H }); return r.ok ? await r.json() : null; } catch { return null; }
}
const SLUGS = ['fifa.world', 'fifa.friendly', 'fifa.worldq.caf', 'caf.nations',
               'caf.nations_qual', 'caf.nations.qual', 'caf.champions', 'fifa.confederations'];
const ids = new Set<string>();
for (const slug of SLUGS) {
  const d = await g(`${B}/${slug}/teams`);
  if (!d) { console.log(`SLUG ${slug}: no response`); continue; }
  for (const s of d.sports ?? []) for (const l of s.leagues ?? []) {
    const teams = (l.teams ?? []).map((t: any) => [String(t.team?.id), String(t.team?.displayName)]);
    const hit = teams.filter(([, n]: any) => /morocco/i.test(n));
    hit.forEach(([i]: any) => ids.add(i));
    console.log(`SLUG ${slug}: name="${l.name}" year=${l.year} teams=${teams.length} morocco=${hit.map(([i,n]: any)=>`${n}=${i}`).join(',') || 'no'}`);
  }
}
console.log('IDS ' + [...ids].join(','));
for (const id of ids) {
  for (const slug of SLUGS) {
    const a = await g(`${B}/${slug}/teams/${id}/schedule`);
    const b = await g(`${B}/${slug}/teams/${id}/schedule?fixture=true`);
    const past = (a?.events ?? []).length, up = (b?.events ?? []).length;
    if (past || up) {
      const first = (b?.events ?? [])[0] ?? (a?.events ?? [])[0];
      console.log(`FIX ${slug} id=${id}: past=${past} upcoming=${up} sample=${first?.date} ${first?.name}`);
    }
  }
}
