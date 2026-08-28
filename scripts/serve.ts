// Local server so you can subscribe from a phone on the same wifi,
// before anything gets deployed.
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { feedFor } from '../lib/serve.ts';
import { TEAMS } from '../lib/teams.ts';

const PORT = 3000;

createServer(async (req, res) => {
  const path = (req.url ?? '/').split('?')[0];
  const m = path.match(/^\/feed\/([a-z0-9-]+)\.ics$/i);
  if (!m) { res.writeHead(404).end('not found'); return; }

  const { status, body, stale } = await feedFor(m[1]);
  if (status === 503) { res.writeHead(503).end('fixture data unavailable'); return; }
  res.writeHead(200, {
    'Content-Type': 'text/calendar; charset=utf-8',
    ...(stale ? { 'X-Feed-Stale': '1' } : {}),
  }).end(body);
  console.log(`  ${new Date().toLocaleTimeString()}  ${path} -> ${body.length}B${stale ? ' (stale)' : ''}`);
}).listen(PORT, () => {
  const lan = Object.values(networkInterfaces()).flat()
    .find(i => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`serving on http://localhost:${PORT}`);
  if (lan) {
    console.log(`\nSubscribe from your phone (same wifi) — tap or paste:`);
    for (const t of TEAMS) console.log(`  webcal://${lan}:${PORT}/feed/${t.slug}.ics   (${t.name})`);
  }
  console.log('\nctrl-c to stop\n');
});
