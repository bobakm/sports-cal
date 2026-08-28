export {};
// One-off diagnostic, run via the diag workflow from GitHub's IPs when ESPN
// has blocked local requests.
const B = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
const OURS = ['Manchester United', 'Arsenal', 'Liverpool', 'Tottenham', 'Brighton'];

async function g(u: string): Promise<any | null> {
  await new Promise(r => setTimeout(r, 400));
  try { const r = await fetch(u, { headers: H }); return r.ok ? await r.json() : null; }
  catch { return null; }
}

for (const lg of ['uefa.champions', 'uefa.europa', 'uefa.conference']) {
  const d = await g(`${B}/${lg}/teams`);
  if (!d) { console.log(`${lg}: no response`); continue; }
  const teams: [string, string][] = [];
  for (const s of d.sports ?? []) for (const l of s.leagues ?? []) for (const t of l.teams ?? [])
    teams.push([String(t.team?.id), String(t.team?.displayName)]);
  const hits = teams.filter(([, n]) => OURS.some(o => n.includes(o)));
  console.log(`${lg}: ${teams.length} teams | ours: ${hits.map(([i, n]) => `${n}=${i}`).join(', ') || 'NONE'}`);

  const sb = await g(`${B}/${lg}/scoreboard`);
  console.log(`  scoreboard events: ${(sb?.events ?? []).length}`);
}

for (const [name, id] of [['Arsenal', '359'], ['Liverpool', '364'], ['Tottenham', '367'], ['ManUtd', '360']]) {
  const a = await g(`${B}/uefa.champions/teams/${id}/schedule`);
  const b = await g(`${B}/uefa.champions/teams/${id}/schedule?fixture=true`);
  const evs = [...(a?.events ?? []), ...(b?.events ?? [])];
  console.log(`uefa.champions ${name} (${id}): past=${(a?.events ?? []).length} upcoming=${(b?.events ?? []).length}`
    + (evs.length ? ` | first=${evs[0].date} ${evs[0].name}` : ''));
}
