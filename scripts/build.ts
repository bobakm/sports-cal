// Static site build: writes every feed plus the subscribe page into site/.
// Run by GitHub Actions on a schedule; nothing runs at request time.
import { mkdirSync, writeFileSync } from 'node:fs';
import { TEAMS, type Team } from '../lib/teams.ts';
import { PRESETS, teamsFor } from '../lib/presets.ts';
import { fetchTeamFixtures, type Fixture } from '../lib/espn.ts';
import { buildFeed, buildBundle } from '../lib/ics.ts';
import { renderIndex } from '../lib/page.ts';

// host + path, no scheme — we prefix webcal:// or https:// as needed
const SITE = process.env.SITE_BASE ?? 'bobakm.github.io/sports-cal';

mkdirSync('site/feed', { recursive: true });

// Fetch every team once, reuse across presets.
const fixtures = new Map<string, Fixture[]>();
let failures = 0;
for (const team of TEAMS) {
  try {
    const f = await fetchTeamFixtures(team);
    fixtures.set(team.slug, f);
    console.log(`  ${team.slug.padEnd(10)} ${String(f.length).padStart(3)} fixtures`);
  } catch (e) {
    failures++;
    console.error(`  ${team.slug.padEnd(10)} FAILED: ${(e as Error).message}`);
  }
}

// Refuse to publish a gutted site. Deploying a mostly-empty set of feeds would
// make every subscriber's calendar delete the events it already has; failing
// the build instead leaves the previous deployment serving.
const got = [...fixtures.values()].filter(f => f.length > 0).length;
if (got < Math.ceil(TEAMS.length * 0.5)) {
  console.error(`\nABORT: only ${got}/${TEAMS.length} teams returned fixtures.`);
  console.error('Refusing to deploy — the previous deployment stays live.');
  process.exit(1);
}

const write = (path: string, body: string) => {
  writeFileSync(`site/${path}`, body);
  console.log(`  wrote ${path} (${(body.length / 1024).toFixed(1)} KB)`);
};

console.log('\nfeeds:');
for (const team of TEAMS) {
  const f = fixtures.get(team.slug);
  if (!f?.length) { console.log(`  skip ${team.slug} (no fixtures)`); continue; }
  write(`feed/${team.slug}.ics`, buildFeed(team, f));
}

for (const preset of PRESETS) {
  const entries = teamsFor(preset)
    .map(team => ({ team, fixtures: fixtures.get(team.slug) ?? [] }))
    .filter(e => e.fixtures.length);
  if (!entries.length) continue;
  write(`feed/${preset.slug}.ics`, buildBundle(preset.name, entries));
}

const counts = new Map(TEAMS.map(t => [t.slug, (fixtures.get(t.slug) ?? []).length]));
writeFileSync('site/index.html', renderIndex(SITE, TEAMS, PRESETS, counts));
writeFileSync('site/.nojekyll', '');
console.log(`\nbuilt for https://${SITE}  (${failures} fetch failures)`);
