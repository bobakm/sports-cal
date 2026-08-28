import { TEAMS, type Team } from './teams.ts';

/** Pre-generated multi-team feeds. Static hosting can't build arbitrary
 *  combinations on demand, so these are the curated ones. Adding another is
 *  a one-line change here. */
export type Preset = { slug: string; name: string; teams: string[] };

export const PRESETS: Preset[] = [
  { slug: 'everything', name: 'Everything', teams: TEAMS.map(t => t.slug) },
  { slug: 'houston',    name: 'Houston',    teams: ['astros'] },
  { slug: 'soccer',     name: 'Soccer',     teams: ['iran'] },
];

export const teamsFor = (p: Preset): Team[] =>
  p.teams.map(s => TEAMS.find(t => t.slug === s)).filter((t): t is Team => !!t);
