import type { Fixture } from './espn.ts';
import type { Team } from './teams.ts';
import { tierFor, fixtureKey, type Tier } from './tiers.ts';

/** "Same day" is ambiguous for a 20:00 ET game or an 11:00 UTC European one.
 *  All day-bucketing happens in this zone regardless of where the subscriber
 *  lives. */
export const CLUSTER_TZ = 'America/Chicago';

/** Counting how many teams play on a day turned out to measure the schedule,
 *  not significance — four college teams play most Saturdays and the MLB sides
 *  play daily, so a volume rule flagged 207 of 216 days. Alerts are now about
 *  WHICH game it is, not how many there are. */
export const HOUSTON_HOME_SLUGS = ['astros', 'houston'];
export const REGIONAL_HOME_SLUGS = ['stars'];

const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLUSTER_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});
export const dayKey = (d: Date): string => DAY.format(d);

export type Cluster = { day: string; kind: string; summary: string; description: string };
type Entry = { team: Team; fixture: Fixture; tier: Tier };

export function findClusters(
  byTeam: Map<string, Fixture[]>, teams: Team[], headToHead: Set<string>,
): { marquee: Cluster[]; local: Cluster[] } {
  const bySlug = new Map(teams.map(t => [t.slug, t]));
  const days = new Map<string, Entry[]>();

  for (const [slug, fixtures] of byTeam) {
    const team = bySlug.get(slug);
    if (!team) continue;
    for (const fixture of fixtures) {
      const k = dayKey(fixture.start);
      if (!days.has(k)) days.set(k, []);
      days.get(k)!.push({ team, fixture, tier: tierFor(fixture, headToHead) });
    }
  }

  const out: Cluster[] = [];
  const local: Cluster[] = [];
  for (const [day, entries] of [...days].sort()) {
    const sorted = entries.sort((a, b) => a.fixture.start.getTime() - b.fixture.start.getTime());
    const line = (e: Entry) =>
      `${e.team.short} ${e.fixture.homeAway === 'away' ? '@' : 'v'} ${e.fixture.opponent}`;

    // Two teams you follow, playing each other.
    // One line per FIXTURE, not per team — a head-to-head game appears under
    // both teams and would otherwise read "PHI @ Cardinals, STL v Phillies".
    const h2hByFixture = new Map<string, Entry[]>();
    for (const e of sorted.filter(e => e.tier === 1)) {
      const k = fixtureKey(e.fixture);
      if (!h2hByFixture.has(k)) h2hByFixture.set(k, []);
      h2hByFixture.get(k)!.push(e);
    }
    if (h2hByFixture.size) {
      const names = [...h2hByFixture.values()].map(pair => {
        const home = pair.find(e => e.fixture.homeAway === 'home');
        const away = pair.find(e => e.fixture.homeAway === 'away');
        return home && away ? `${away.team.short} @ ${home.team.short}` : line(pair[0]);
      });
      out.push({ day, kind: 'head-to-head', summary: `🔥 ${names.join(', ')}`,
                 description: sorted.map(line).join('\n') });
    }

    // Marquee: cups, knockouts, tournaments, ranked college matchups.
    const marquee = sorted.filter(e => e.tier === 2);
    if (marquee.length && !h2h.length) {
      out.push({ day, kind: 'marquee',
                 summary: `⭐ ${[...new Set(marquee.map(line))].slice(0, 3).join(', ')}`,
                 description: sorted.map(line).join('\n') });
    }

    // Games you could physically attend.
    const houston = sorted.filter(e =>
      HOUSTON_HOME_SLUGS.includes(e.team.slug) && e.fixture.homeAway === 'home');
    if (houston.length) {
      local.push({ day, kind: 'houston',
                 summary: `🏟 Houston: ${houston.map(line).join(', ')}`,
                 description: sorted.map(line).join('\n') });
    }

    const regional = sorted.filter(e =>
      REGIONAL_HOME_SLUGS.includes(e.team.slug) && e.fixture.homeAway === 'home');
    if (regional.length) {
      local.push({ day, kind: 'dallas',
                 summary: `🚗 Dallas: ${regional.map(line).join(', ')}`,
                 description: sorted.map(line).join('\n') });
    }
  }
  return { marquee: out, local };
}
