import ical, { ICalCalendarMethod } from 'ical-generator';
import { ICON, type Team } from './teams.ts';
import type { Fixture } from './espn.ts';

const PRODID = { company: 'sports-calendar', product: 'feed', language: 'EN' };

export function buildFeed(team: Team, fixtures: Fixture[]): string {
  const cal = ical({
    name: `${ICON[team.category]} ${team.name}`,
    description: `${team.name} fixtures. Times update automatically.`,
    prodId: PRODID,
    ttl: 60 * 60 * 6,          // REFRESH-INTERVAL / X-PUBLISHED-TTL hint
    method: ICalCalendarMethod.PUBLISH,
  });

  for (const f of fixtures) {
    const vs = f.homeAway === 'away' ? '@' : 'v';
    cal.createEvent({
      // Deterministic: same game always produces the same UID, so a refresh
      // updates the existing event instead of adding a second copy.
      id: `${team.slug}-${f.competition}-${f.id}@sports-calendar`,
      start: f.start,
      end: new Date(f.start.getTime() + team.durationMin * 60_000),
      summary: `${team.short} ${vs} ${f.opponent}`,
      location: f.venue,
      description: describe(f, team),
    });
  }
  return cal.toString();
}

function describe(f: Fixture, team: Team): string {
  const lines: string[] = [];
  const tv = f.broadcasts.length ? f.broadcasts.join(', ') : team.defaultBroadcast;
  if (tv) lines.push(`TV: ${tv}`);
  else if (!f.completed) lines.push('TV: not announced yet');
  if (f.venue) lines.push(f.venue);
  lines.push('', 'Broadcast info is best-effort and fills in closer to game day.');
  return lines.join('\n');
}

/** Combined feed for several teams. Deduped by ESPN event id: a fixture
 *  between two tracked teams is returned by BOTH teams' sources and would
 *  otherwise appear twice on the calendar. */
export function buildBundle(
  name: string,
  entries: { team: Team; fixtures: Fixture[] }[],
): string {
  const cal = ical({
    name,
    description: `${name} — fixtures update automatically.`,
    prodId: PRODID,
    ttl: 60 * 60 * 6,
    method: ICalCalendarMethod.PUBLISH,
  });

  const seen = new Set<string>();
  for (const { team, fixtures } of entries) {
    for (const f of fixtures) {
      const key = `${f.competition}-${f.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const vs = f.homeAway === 'away' ? '@' : 'v';
      cal.createEvent({
        id: `${f.competition}-${f.id}@sports-calendar`,
        start: f.start,
        end: new Date(f.start.getTime() + team.durationMin * 60_000),
        summary: `${team.short} ${vs} ${f.opponent}`,
        location: f.venue,
        description: describe(f, team),
      });
    }
  }
  return cal.toString();
}

/** A valid, empty-but-titled feed for an unknown slug — never a raw error,
 *  because a calendar client will retry a broken URL forever. */
export function emptyFeed(slug: string): string {
  return ical({ name: `Unknown team (${slug})`, prodId: PRODID }).toString();
}
