// Local end-to-end check: fetch one team, build the feed, write it to out/.
import { writeFileSync } from 'node:fs';
import { bySlug } from '../lib/teams.ts';
import { fetchTeamFixtures } from '../lib/espn.ts';
import { buildFeed } from '../lib/ics.ts';

const slug = process.argv[2] ?? 'astros';
const team = bySlug(slug);
if (!team) { console.error(`unknown team: ${slug}`); process.exit(1); }

console.log(`fetching ${team.name} (${team.sources.length} source(s))…`);
const fixtures = await fetchTeamFixtures(team);

const now = Date.now();
const upcoming = fixtures.filter(f => f.start.getTime() >= now);
const withTv = fixtures.filter(f => f.broadcasts.length).length;
console.log(`  ${fixtures.length} fixtures in window (${upcoming.length} upcoming), ${withTv} with broadcast info`);

const ics = buildFeed(team, fixtures);
const path = `out/${team.slug}.ics`;
writeFileSync(path, ics);
console.log(`  wrote ${path} (${(ics.length / 1024).toFixed(1)} KB, ${(ics.match(/BEGIN:VEVENT/g) ?? []).length} VEVENTs)`);

console.log('\nnext 5:');
for (const f of upcoming.slice(0, 5)) {
  const tv = f.broadcasts.join(', ') || '—';
  console.log(`  ${f.start.toISOString().slice(0, 16).replace('T', ' ')}Z  ${team.short} ${f.homeAway === 'away' ? '@' : 'v'} ${f.opponent.padEnd(12)} ${tv}`);
}
