import type { Fixture } from './espn.ts';
import type { Team } from './teams.ts';
import { tierFor, type Tier } from './tiers.ts';

/** "Same day" is ambiguous for a 20:00 ET game or an 11:00 UTC European one.
 *  Every day-bucketing decision happens in this zone regardless of where the
 *  subscriber lives. */
export const CLUSTER_TZ = 'America/Chicago';

/** Tunable — these are the rules most likely to need adjusting after a season
 *  of watching them fire. */
export const BBQ_MIN_TEAMS = 3;              // 3+ of your teams on one day
export const BBQ_MIN_TEAMS_WITH_BIG_GAME = 2; // or 2, if one is a big game
export const HOUSTON_HOME_SLUGS = ['astros', 'houston'];
export const REGIONAL_HOME_SLUGS = ['stars'];

const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLUSTER_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});
export const dayKey = (d: Date): string => DAY.format(d);

export type Cluster = { day: string; summary: string; description: string };
type Entry = { team: Team; fixture: Fixture; tier: Tier };

export function findClusters(
  byTeam: Map<string, Fixture[]>, teams: Team[], headToHead: Set<string>,
): Cluster[] {
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
  for (const [day, entries] of [...days].sort()) {
    const distinctTeams = new Set(entries.map(e => e.team.slug));
    const bigGame = entries.some(e => e.tier <= 2);

    const houston = entries.filter(e =>
      HOUSTON_HOME_SLUGS.includes(e.team.slug) && e.fixture.homeAway === 'home');
    const regional = entries.filter(e =>
      REGIONAL_HOME_SLUGS.includes(e.team.slug) && e.fixture.homeAway === 'home');

    const bbq = distinctTeams.size >= BBQ_MIN_TEAMS
      || (distinctTeams.size >= BBQ_MIN_TEAMS_WITH_BIG_GAME && bigGame);

    const lines = entries
      .sort((a, b) => a.fixture.start.getTime() - b.fixture.start.getTime())
      .map(e => `${e.team.short} ${e.fixture.homeAway === 'away' ? '@' : 'v'} ${e.fixture.opponent}`);

    if (houston.length) {
      out.push({ day, summary: `🏟 Houston Day — ${houston.map(e => e.team.short).join(' + ')} home`,
                 description: lines.join('\n') });
    } else if (regional.length) {
      out.push({ day, summary: '🚗 Stars home in Dallas', description: lines.join('\n') });
    }
    if (bbq) {
      out.push({ day, summary: `🔥 BBQ Day — ${entries.length} games, ${distinctTeams.size} teams`,
                 description: lines.join('\n') });
    }
  }
  return out;
}
