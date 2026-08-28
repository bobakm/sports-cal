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

/** A ranked opponent makes a regular college game a real occasion. Only applied
 *  to college football: ESPN reuses curatedRank for soccer LEAGUE POSITION, so
 *  applying it everywhere flags almost every Premier League fixture. */
export const RANKED_CUTOFF = 25;
const RANKING_APPLIES = new Set(['college-football']);

/** Opponents that make an ordinary league fixture a big game. Hand-maintained
 *  on purpose: there's no ranking field that works here — ESPN's curatedRank is
 *  league position for soccer, so any numeric cutoff flags the whole division.
 *  Matched as a substring against ESPN's short display name. Edit freely. */
export const MARQUEE_OPPONENTS = [
  // England
  'Man City', 'Manchester City', 'Man United', 'Manchester United', 'Liverpool',
  'Arsenal', 'Chelsea', 'Tottenham', 'Newcastle',
  // Europe
  'Real Madrid', 'Barcelona', 'Bayern', 'Paris Saint-Germain', 'PSG',
  'Inter', 'Milan', 'Juventus', 'Atletico', 'Atlético', 'Dortmund',
  // National-team heavyweights
  'Brazil', 'Argentina', 'France', 'Spain', 'Germany', 'Portugal',
];

const isMarqueeOpponent = (opponent: string) =>
  MARQUEE_OPPONENTS.some(o => opponent.toLowerCase().includes(o.toLowerCase()));

export function tierFor(f: Fixture, headToHead: Set<string>): Tier {
  if (headToHead.has(fixtureKey(f))) return 1;            // two teams you follow
  if (!REGULAR_SEASON.has(f.competition) && !FRIENDLIES.has(f.competition)) return 2;
  if (RANKING_APPLIES.has(f.competition) && f.opponentRank && f.opponentRank <= RANKED_CUTOFF) return 2;
  if (isMarqueeOpponent(f.opponent)) return 2;
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
