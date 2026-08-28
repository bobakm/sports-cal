import { feedFor } from '../lib/serve.ts';

const good = await feedFor('astros');
const bad  = await feedFor('not-a-team');
const t0 = Date.now();
const again = await feedFor('astros');
const dt = Date.now() - t0;

console.log('astros       ->', good.status, good.body.length + 'B');
console.log('bogus slug   ->', bad.status, bad.body.length + 'B  (valid ICS, not an error)');
console.log('cache hit    ->', again.status, `${dt}ms`);
console.log('cache served identical body:', again.body === good.body);
