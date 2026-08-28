// Static site build: writes every feed plus the subscribe page into site/.
// Run by GitHub Actions on a schedule; nothing runs at request time.
import { mkdirSync, writeFileSync } from 'node:fs';
import { TEAMS, type Team } from '../lib/teams.ts';
import { PRESETS, teamsFor, h2hSlug, h2hName } from '../lib/presets.ts';
import { fetchTeamFixtures, type Fixture } from '../lib/espn.ts';
import { buildFeed, buildBundle, buildAlerts } from '../lib/ics.ts';
import { findHeadToHead } from '../lib/tiers.ts';
import { findClusters } from '../lib/clusters.ts';
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

// A fixture that shows up under two tracked teams IS your teams playing each
// other — that's what earns the 🔥 flag.
const headToHead = findHeadToHead(fixtures);
console.log(`\n${headToHead.size} head-to-head fixtures between your teams`);

console.log('\nfeeds:');
for (const team of TEAMS) {
  const f = fixtures.get(team.slug);
  if (!f?.length) { console.log(`  skip ${team.slug} (no fixtures)`); continue; }
  write(`feed/${team.slug}.ics`, buildFeed(team, f, headToHead));
}

const bundleCounts = new Map<string, number>();
for (const preset of PRESETS) {
  const entries = teamsFor(preset)
    .map(team => ({ team, fixtures: fixtures.get(team.slug) ?? [] }))
    .filter(e => e.fixtures.length);
  if (!entries.length) continue;
  const ics = buildBundle(preset.name, entries, headToHead);
  bundleCounts.set(preset.slug, (ics.match(/BEGIN:VEVENT/g) ?? []).length);
  write(`feed/${preset.slug}.ics`, ics);

  // Sparse variant: only fixtures where two tracked teams meet.
  const h2hEntries = entries
    .map(e => ({ team: e.team, fixtures: e.fixtures.filter(f => headToHead.has(`${f.competition}-${f.id}`)) }))
    .filter(e => e.fixtures.length);
  if (h2hEntries.length) {
    const h = buildBundle(h2hName(preset), h2hEntries, headToHead);
    bundleCounts.set(h2hSlug(preset), (h.match(/BEGIN:VEVENT/g) ?? []).length);
    write(`feed/${h2hSlug(preset)}.ics`, h);
  }
}

const clusters = findClusters(fixtures, TEAMS, headToHead);
write('feed/alerts.ics', buildAlerts(clusters));
const byKind = new Map<string, number>();
for (const c of clusters) {
  byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);
}
console.log(`  ${clusters.length} cluster days flagged:`);
for (const [k, n] of byKind) console.log(`    ${k}: ${n}`);

const counts = new Map(TEAMS.map(t => [t.slug, (fixtures.get(t.slug) ?? []).length]));
writeFileSync('site/index.html', renderIndex(SITE, TEAMS, PRESETS, counts, bundleCounts, clusters.length));
writeFileSync('site/.nojekyll', '');
console.log(`\nbuilt for https://${SITE}  (${failures} fetch failures)`);
