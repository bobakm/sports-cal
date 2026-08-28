import ical, { ICalCalendarMethod } from 'ical-generator';
import { ICON, type Team } from './teams.ts';
import type { Fixture } from './espn.ts';
import { tierFor, fixtureKey, TIER_ICON } from './tiers.ts';
import type { Cluster } from './clusters.ts';

const PRODID = { company: 'sports-calendar', product: 'feed', language: 'EN' };
const TTL = 60 * 60 * 6;   // REFRESH-INTERVAL / X-PUBLISHED-TTL hint

const cal = (name: string, description: string) =>
  ical({ name, description, prodId: PRODID, ttl: TTL, method: ICalCalendarMethod.PUBLISH });

/** Titles get read in a crowded month view where ~20 characters survive, so the
 *  tracked team and any flag go first and the detail goes in the description. */
function summaryFor(team: Team, f: Fixture, headToHead: Set<string>): string {
  const icon = TIER_ICON[tierFor(f, headToHead)];
  const away = f.homeAway === 'away' ? '@ ' : '';
  if (f.score) return `${icon}${team.short} ${f.score.us}-${f.score.them} ${away}${f.opponent}`;
  return `${icon}${team.short} ${f.homeAway === 'away' ? '@' : 'v'} ${f.opponent}`;
}

function describe(f: Fixture, team: Team): string {
  const lines: string[] = [];
  if (f.score) lines.push(`Final: ${team.short} ${f.score.us}-${f.score.them} ${f.opponent}`);
  const tv = f.broadcasts.length ? f.broadcasts.join(', ') : team.defaultBroadcast;
  if (tv) lines.push(`TV: ${tv}`);
  else if (!f.completed) lines.push('TV: not announced yet');
  if (f.venue) lines.push(f.venue);
  lines.push('', 'Broadcast info is best-effort and fills in closer to game day.');
  return lines.join('\n');
}

function addEvent(c: ReturnType<typeof cal>, team: Team, f: Fixture, h: Set<string>, uid: string) {
  c.createEvent({
    id: uid,
    start: f.start,
    end: new Date(f.start.getTime() + team.durationMin * 60_000),
    summary: summaryFor(team, f, h),
    location: f.venue,
    description: describe(f, team),
  });
}

export function buildFeed(team: Team, fixtures: Fixture[], headToHead: Set<string>): string {
  const c = cal(`${ICON[team.category]} ${team.name}`,
                `${team.name} fixtures. Times update automatically.`);
  for (const f of fixtures)
    // Deterministic: the same game always yields the same UID, so a refresh
    // updates the existing event rather than adding a second copy.
    addEvent(c, team, f, headToHead, `${team.slug}-${fixtureKey(f)}@sports-calendar`);
  return c.toString();
}

/** Combined feed. Deduped by fixture key: a game between two teams you follow
 *  is returned by BOTH teams' sources and would otherwise appear twice. */
export function buildBundle(
  name: string, entries: { team: Team; fixtures: Fixture[] }[], headToHead: Set<string>,
): string {
  const c = cal(name, `${name} — fixtures update automatically.`);
  const seen = new Set<string>();
  for (const { team, fixtures } of entries)
    for (const f of fixtures) {
      const key = fixtureKey(f);
      if (seen.has(key)) continue;
      seen.add(key);
      addEvent(c, team, f, headToHead, `${key}@sports-calendar`);
    }
  return c.toString();
}

/** All-day markers for cluster days. These are true DATE-valued events, not
 *  midnight timestamps — a timestamped "all day" event lands on the wrong date
 *  for anyone outside the clustering timezone. */
export function buildAlerts(clusters: Cluster[]): string {
  const c = cal('🔥 Sports Days', 'All-day markers for days worth clearing.');
  for (const cl of clusters) {
    c.createEvent({
      id: `${cl.day}-${cl.kind}@sports-calendar`,
      start: new Date(`${cl.day}T00:00:00Z`),
      allDay: true,
      summary: cl.summary,
      description: cl.description,
    });
  }
  return c.toString();
}

/** Valid, empty-but-titled feed for an unknown slug — never a raw error,
 *  because a calendar client retries a broken URL forever. */
export const emptyFeed = (slug: string): string =>
  ical({ name: `Unknown team (${slug})`, prodId: PRODID }).toString();
