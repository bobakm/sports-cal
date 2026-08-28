export {};
// Which SEASON is ESPN's uefa.champions team list reporting?
const B = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
async function g(u: string): Promise<any | null> {
  await new Promise(r => setTimeout(r, 400));
  try { const r = await fetch(u, { headers: H }); return r.ok ? await r.json() : null; } catch { return null; }
}

const d = await g(`${B}/uefa.champions/teams`);
for (const s of d?.sports ?? []) for (const l of s.leagues ?? []) {
  console.log(`league=${l.name} season=${JSON.stringify(l.season)} year=${l.year}`);
  const names = (l.teams ?? []).map((t: any) => t.team?.displayName).sort();
  console.log(`teams(${names.length}): ${names.join(', ')}`);
}
// Does the scoreboard know about 2026-27 yet?
for (const q of ['', '?dates=20260901-20261231']) {
  const sb = await g(`${B}/uefa.champions/scoreboard${q}`);
  const evs = sb?.events ?? [];
  console.log(`scoreboard${q || ' (default)'}: events=${evs.length} season=${JSON.stringify(sb?.season)}`);
  if (evs.length) console.log(`  first: ${evs[0].date} ${evs[0].name}`);
}
