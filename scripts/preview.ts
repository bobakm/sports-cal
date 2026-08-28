// Renders the subscribe page with stub counts — lets us check layout/wording
// without hitting ESPN.
import { mkdirSync, writeFileSync } from 'node:fs';
import { TEAMS } from '../lib/teams.ts';
import { PRESETS } from '../lib/presets.ts';
import { renderIndex } from '../lib/page.ts';

const counts = new Map(TEAMS.map((t, i) => [t.slug, [53, 84, 12, 4][i] ?? 20]));
mkdirSync('out', { recursive: true });
writeFileSync('out/preview.html', renderIndex('bobakm.github.io/sports-cal', TEAMS, PRESETS, counts));
console.log('wrote out/preview.html');
