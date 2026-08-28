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

/** EPL sides also play European nights, which the eng.1 endpoint doesn't
 *  return — those are exactly the fixtures worth having. Every club queries
 *  every European competition: whichever one they actually qualified for
 *  returns fixtures and the rest return nothing, so promotion, relegation and
 *  qualification changes need no edits here. (ESPN's Conference League slug is
 *  'uefa.europa.conf'; 'uefa.conference' 404s.) */
const EURO = ['uefa.champions', 'uefa.europa', 'uefa.europa.conf'];
const EPL = (slug: string, name: string, short: string, id: string): Team => ({
  slug, name, short, category: 'EPL', durationMin: 120,
  defaultBroadcast: 'NBC / USA / Peacock',
  sources: [{ sport: 'soccer', league: 'eng.1', teamId: id },
            ...EURO.map(league => ({ sport: 'soccer', league, teamId: id }))],
});

/** National teams need every competition they might appear in. Miss one and
 *  those fixtures are simply absent — no endpoint returns them all. */
const NATIONAL = (slug: string, name: string, short: string, id: string, leagues: string[]): Team => ({
  slug, name, short, category: 'NATIONAL', durationMin: 120,
  sources: leagues.map(league => ({ sport: 'soccer', league, teamId: id })),
});

const UEFA_NAT = ['fifa.world', 'fifa.friendly', 'uefa.nations', 'fifa.worldq.uefa', 'uefa.euroq'];

export const TEAMS: Team[] = [
  EPL('man-united', 'Manchester United', 'MUN', '360'),
  EPL('brighton',   'Brighton',          'BHA', '331'),
  EPL('arsenal',    'Arsenal',           'ARS', '359'),
  EPL('liverpool',  'Liverpool',         'LIV', '364'),
  EPL('tottenham',  'Tottenham',         'TOT', '367'),

  NHL('canucks', 'Vancouver Canucks', 'VAN', 'van', 'ESPN+ (out-of-market)'),
  NHL('stars',   'Dallas Stars',      'DAL', 'dal', 'Victory+ / local'),
  NHL('bruins',  'Boston Bruins',     'BOS', 'bos', 'ESPN+ (out-of-market)'),

  NCAAF('houston',    'Houston Cougars',   'HOU', '248'),
  NCAAF('cal',        'Cal Golden Bears',  'CAL', '25'),
  NCAAF('texas-am',   'Texas A&M',         'TAM', '245'),
  NCAAF('penn-state', 'Penn State',        'PSU', '213'),

  MLB('astros',    'Houston Astros',      'HOU', 'hou'),
  MLB('phillies',  'Philadelphia Phillies','PHI', 'phi'),
  MLB('red-sox',   'Boston Red Sox',      'BOS', 'bos'),
  MLB('cardinals', 'St. Louis Cardinals', 'STL', 'stl'),

  NATIONAL('usa-men',     'USA (Men)',        'USA', '660',
    ['fifa.world', 'fifa.friendly', 'concacaf.gold', 'fifa.worldq.concacaf']),
  NATIONAL('usa-women',   'USA (Women)',      'USW', '2765',
    ['fifa.friendly.w', 'fifa.wwc']),
  NATIONAL('iran',        'Iran (Men)',       'IRN', '469',
    ['afc.asian.cup', 'fifa.friendly', 'fifa.worldq.afc', 'fifa.world']),
  NATIONAL('belgium',     'Belgium (Men)',    'BEL', '459', UEFA_NAT),
  NATIONAL('england',     'England (Men)',    'ENG', '448', UEFA_NAT),
  NATIONAL('italy',       'Italy (Men)',      'ITA', '162', UEFA_NAT),
  NATIONAL('netherlands', 'Netherlands (Men)','NED', '449', UEFA_NAT),
];

export const ICON: Record<Team['category'], string> = {
  EPL: '⚽', NHL: '🏒', NCAAF: '🏈', MLB: '⚾', NATIONAL: '🌍',
};

export const bySlug = (slug: string): Team | undefined =>
  TEAMS.find(t => t.slug === slug.toLowerCase());
