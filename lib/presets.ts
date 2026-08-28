import { TEAMS, ICON, type Team } from './teams.ts';

/** Pre-generated multi-team feeds. Static hosting can't build arbitrary
 *  combinations on demand, so these are the curated ones: everything, plus
 *  one per category. Adding another is a line here. */
export type Preset = { slug: string; name: string; teams: string[] };

const inCategory = (c: Team['category']) =>
  TEAMS.filter(t => t.category === c).map(t => t.slug);

export const PRESETS: Preset[] = [
  { slug: 'everything', name: '🗓 Everything',   teams: TEAMS.map(t => t.slug) },
  { slug: 'epl',        name: `${ICON.EPL} Premier League`, teams: inCategory('EPL') },
  { slug: 'nhl',        name: `${ICON.NHL} NHL`,            teams: inCategory('NHL') },
  { slug: 'ncaaf',      name: `${ICON.NCAAF} College Football`, teams: inCategory('NCAAF') },
  { slug: 'mlb',        name: `${ICON.MLB} MLB`,            teams: inCategory('MLB') },
  { slug: 'national',   name: `${ICON.NATIONAL} National Teams`, teams: inCategory('NATIONAL') },
];

export const teamsFor = (p: Preset): Team[] =>
  p.teams.map(s => TEAMS.find(t => t.slug === s)).filter((t): t is Team => !!t);
