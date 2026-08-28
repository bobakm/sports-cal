export {};
// Find ESPN's real slug for the Europa Conference League so an EPL club that
// qualifies for it isn't silently missing those fixtures.
const B = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
async function g(u: string): Promise<any | null> {
  await new Promise(r => setTimeout(r, 400));
  try { const r = await fetch(u, { headers: H }); return r.ok ? await r.json() : null; } catch { return null; }
}
for (const slug of ['uefa.conference', 'uefa.europa.conf', 'uefa.conf', 'uefa.europa.conference']) {
  const d = await g(`${B}/${slug}/teams`);
  if (!d) { console.log(`SLUG ${slug}: no response`); continue; }
  for (const s of d.sports ?? []) for (const l of s.leagues ?? []) {
    const names = (l.teams ?? []).map((t: any) => t.team?.displayName);
    console.log(`SLUG ${slug}: name="${l.name}" year=${l.year} teams=${names.length}`);
  }
}
