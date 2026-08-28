import { bySlug } from './teams.ts';
import { fetchTeamFixtures } from './espn.ts';
import { buildFeed, emptyFeed } from './ics.ts';

const TTL_MS = 6 * 60 * 60 * 1000;
type Entry = { ics: string; at: number };
const cache = new Map<string, Entry>();

/** Returns the feed body for a slug. Never throws: on upstream failure it
 *  serves the last good copy, and if there is none it signals 503 so the
 *  client keeps what it already has. An empty-but-valid feed would make
 *  calendar apps DELETE every event they'd previously synced. */
export async function feedFor(slug: string): Promise<{ status: number; body: string; stale: boolean }> {
  const team = bySlug(slug);
  if (!team) return { status: 404, body: emptyFeed(slug), stale: false };

  const hit = cache.get(team.slug);
  if (hit && Date.now() - hit.at < TTL_MS) return { status: 200, body: hit.ics, stale: false };

  try {
    const fixtures = await fetchTeamFixtures(team);
    if (!fixtures.length) throw new Error('upstream returned no fixtures');
    const ics = buildFeed(team, fixtures, new Set());
    cache.set(team.slug, { ics, at: Date.now() });
    return { status: 200, body: ics, stale: false };
  } catch (e) {
    console.warn(`feed ${team.slug}: ${(e as Error).message}`);
    if (hit) return { status: 200, body: hit.ics, stale: true };
    return { status: 503, body: '', stale: false };
  }
}
