import type { Team, Source } from './teams.ts';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// ESPN 403s bare programmatic clients; a browser UA gets through.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'application/json',
};

/** How far back to keep completed games. Past results are nice to have on the
 *  calendar, but the whole season for 20 teams is a lot of VEVENTs. */
export const KEEP_PAST_DAYS = 30;

export type Fixture = {
  id: string;              // ESPN event id — the basis of our stable UID
  start: Date;
  title: string;           // "Astros v Rangers"
  opponent: string;
  homeAway: 'home' | 'away' | 'neutral';
  venue?: string;
  broadcasts: string[];
  competition: string;     // league slug it came from
  completed: boolean;
  score?: { us: number; them: number };
  opponentRank?: number;   // AP/curated rank; absent or 99 = unranked
};

/** ESPN's edge (Akamai) blocks bursts — a parallel sweep of ~70 requests gets
 *  the whole IP a 403 for several minutes. Everything goes through one queue
 *  with a gap between calls; the build is not in a hurry. */
const REQUEST_GAP_MS = 350;
let chain: Promise<unknown> = Promise.resolve();
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(() => new Promise(r => setTimeout(r, REQUEST_GAP_MS))).then(fn);
  chain = next.catch(() => {});
  return next as Promise<T>;
}

async function getJSON(url: string): Promise<any | null> {
  return throttle(() => getJSONNow(url));
}

async function getJSONNow(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) { console.warn(`  ! ${r.status} ${url}`); return null; }
    return await r.json();
  } catch (e) {
    console.warn(`  ! ${(e as Error).message} ${url}`);
    return null;
  }
}

/** Fetch one source. ESPN returns *completed* games bare and *upcoming* ones
 *  only under ?fixture=true — they are disjoint sets, not subset/superset, so
 *  both calls are required. Missing this yields a calendar with one event in it. */
async function fetchSource(src: Source): Promise<Fixture[]> {
  const url = `${BASE}/${src.sport}/${src.league}/teams/${src.teamId}/schedule`;
  const past = await getJSON(url);
  const upcoming = await getJSON(`${url}?fixture=true`);

  const byId = new Map<string, Fixture>();
  for (const data of [past, upcoming]) {
    if (!data) continue;
    const selfId = String(data?.team?.id ?? '');
    for (const ev of (data.events ?? [])) {
      const f = parseEvent(ev, selfId, src.league);
      if (f) byId.set(f.id, f);   // upcoming wins on collision — fresher
    }
  }
  return [...byId.values()];
}

/** ESPN returns competitor.score as {value, displayValue} in some sports and a
 *  bare number/string in others. Number() on the object yields NaN, which
 *  silently dropped every score. */
function scoreOf(raw: any): number {
  const v = raw !== null && typeof raw === 'object' ? (raw.value ?? raw.displayValue) : raw;
  return Number(v);
}

function parseEvent(ev: any, selfId: string, league: string): Fixture | null {
  const comp = (ev.competitions ?? [])[0];
  if (!ev?.id || !ev?.date || !comp) return null;

  const start = new Date(ev.date);
  if (isNaN(start.getTime())) return null;

  const competitors = comp.competitors ?? [];
  // Without a usable selfId every competitor looks like the opponent, which
  // would print "HOU v Houston Astros" and mark every game as home.
  if (!selfId) return null;
  const me = competitors.find((c: any) => String(c?.team?.id) === selfId);
  const them_ = competitors.find((c: any) => String(c?.team?.id) !== selfId);
  if (!me || !them_) return null;

  const broadcasts: string[] = [];
  for (const b of (comp.broadcasts ?? [])) {
    const n = b?.media?.shortName;
    if (n && !broadcasts.includes(n)) broadcasts.push(n);
  }

  const st = comp?.status?.type;
  const completed = Boolean(st?.completed) || st?.name === 'STATUS_FINAL' || st?.state === 'post';
  const us = scoreOf(me?.score), them = scoreOf(them_?.score);
  const score = completed && Number.isFinite(us) && Number.isFinite(them)
    ? { us, them } : undefined;

  const homeAway = comp.neutralSite ? 'neutral' : (me.homeAway ?? 'home');
  const opponent = them_.team?.shortDisplayName ?? them_.team?.displayName ?? 'TBD';

  return {
    id: String(ev.id),
    start,
    title: ev.shortName ?? ev.name ?? 'Game',
    opponent,
    homeAway: homeAway as Fixture['homeAway'],
    venue: comp?.venue?.fullName,
    broadcasts,
    competition: league,
    completed: completed || start.getTime() < Date.now(),
    score,
    opponentRank: Number(them_.curatedRank?.current) || undefined,
  };
}

export async function fetchTeamFixtures(team: Team): Promise<Fixture[]> {
  const batches: Fixture[][] = [];
  for (const src of team.sources) batches.push(await fetchSource(src));
  const cutoff = team.upcomingOnly ? Date.now() : Date.now() - KEEP_PAST_DAYS * 86_400_000;

  // Dedupe across sources by ESPN event id: a national team's fixture can be
  // returned by more than one competition endpoint.
  const byId = new Map<string, Fixture>();
  for (const f of batches.flat()) {
    if (f.start.getTime() >= cutoff) byId.set(f.id, f);
  }
  return [...byId.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}
