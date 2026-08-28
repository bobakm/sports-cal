// Team registry. `sources` matters: club teams have exactly one, but national
// teams have their fixtures scattered across several ESPN competition slugs
// (confirmed by probe — Iran's Asian Cup games live in afc.asian.cup, their
// friendlies in fifa.friendly, and neither endpoint knows about the other).
export type Source = { sport: string; league: string; teamId: string };

export type Team = {
  slug: string;
  name: string;        // sidebar / calendar name
  short: string;       // used in event titles, kept tight for mobile
  category: 'EPL' | 'NHL' | 'NCAAF' | 'MLB' | 'NATIONAL';
  sources: Source[];
  /** Fallback shown when ESPN has no broadcasts for a game. Per-team, not
   *  per-league: Vancouver/Boston resolve to ESPN+ out-of-market while Dallas
   *  is its own streaming deal. Real broadcast data always wins over this. */
  defaultBroadcast?: string;
  durationMin: number;
};

const MLB = (slug: string, name: string, short: string, id: string): Team => ({
  slug, name, short, category: 'MLB', durationMin: 180,
  sources: [{ sport: 'baseball', league: 'mlb', teamId: id }],
});

const NHL = (slug: string, name: string, short: string, id: string, tv: string): Team => ({
  slug, name, short, category: 'NHL', durationMin: 150, defaultBroadcast: tv,
  sources: [{ sport: 'hockey', league: 'nhl', teamId: id }],
});

const NCAAF = (slug: string, name: string, short: string, id: string): Team => ({
  slug, name, short, category: 'NCAAF', durationMin: 210,
  sources: [{ sport: 'football', league: 'college-football', teamId: id }],
});

/** National teams need every competition they might appear in. Miss one and
 *  the fixtures in it are simply absent — there is no endpoint that knows
 *  about all of them. */
const NATIONAL = (slug: string, name: string, short: string, id: string, leagues: string[]): Team => ({
  slug, name, short, category: 'NATIONAL', durationMin: 120,
  sources: leagues.map(league => ({ sport: 'soccer', league, teamId: id })),
});

export const TEAMS: Team[] = [
  MLB('astros', 'Houston Astros', 'HOU', 'hou'),
  NHL('canucks', 'Vancouver Canucks', 'VAN', 'van', 'ESPN+ (out-of-market)'),
  NCAAF('cal', 'Cal Golden Bears', 'CAL', '25'),
  NATIONAL('iran', 'Iran (Men)', 'IRN', '469',
    ['afc.asian.cup', 'fifa.friendly', 'fifa.worldq.afc', 'fifa.world']),
];

export const bySlug = (slug: string): Team | undefined =>
  TEAMS.find(t => t.slug === slug.toLowerCase());
