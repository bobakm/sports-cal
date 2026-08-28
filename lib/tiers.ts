import type { Fixture } from './espn.ts';

export type Tier = 1 | 2 | 3;

/** Regular-season league play. Anything outside this that isn't a friendly is
 *  a cup, tournament or knockout — i.e. worth flagging. Keeping the rule as a
 *  named set means new competitions get treated as notable by default. */
const REGULAR_SEASON = new Set(['eng.1', 'nhl', 'mlb', 'college-football']);

/** Friendlies stay unflagged no matter who's playing. */
const FRIENDLIES = new Set(['fifa.friendly', 'fifa.friendly.w']);

export const TIER_ICON: Record<Tier, string> = { 1: '🔥 ', 2: '⭐ ', 3: '' };

/** Stable identity for a fixture across the teams that share it. */
export const fixtureKey = (f: Fixture) => `${f.competition}-${f.id}`;

/** A ranked opponent makes a regular college game a real occasion. */
export const RANKED_CUTOFF = 25;

export function tierFor(f: Fixture, headToHead: Set<string>): Tier {
  if (headToHead.has(fixtureKey(f))) return 1;            // two teams you follow
  if (!REGULAR_SEASON.has(f.competition) && !FRIENDLIES.has(f.competition)) return 2;
  if (f.opponentRank && f.opponentRank <= RANKED_CUTOFF) return 2;
  return 3;
}

/** Fixtures appearing under more than one tracked team are, by definition,
 *  two of your teams playing each other — no ID matching required. */
export function findHeadToHead(all: Map<string, Fixture[]>): Set<string> {
  const seen = new Map<string, number>();
  for (const fixtures of all.values())
    for (const f of fixtures) seen.set(fixtureKey(f), (seen.get(fixtureKey(f)) ?? 0) + 1);
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}
