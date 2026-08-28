import { feedFor } from '../../lib/serve.ts';

export default async function handler(req: any, res: any) {
  const raw = req.query?.slug ?? '';
  const slug = String(Array.isArray(raw) ? raw[0] : raw).replace(/\.ics$/i, '');
  const { status, body, stale } = await feedFor(slug);

  // 503 on total failure is deliberate: clients keep their existing events on
  // an error response, but would wipe them for a valid-but-empty feed.
  if (status === 503) { res.status(503).send('fixture data unavailable'); return; }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (stale) res.setHeader('X-Feed-Stale', '1');
  res.status(200).send(body);   // unknown slug -> valid empty feed, never a raw error
}
