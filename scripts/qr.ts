// Prints a scannable QR for a feed URL — the fastest way to get a webcal
// link from this machine onto a phone.
import { networkInterfaces } from 'node:os';
import QR from 'qrcode';

const slug = process.argv[2] ?? 'astros';
const lan = Object.values(networkInterfaces()).flat()
  .find(i => i && i.family === 'IPv4' && !i.internal)?.address;
if (!lan) { console.error('no LAN address found'); process.exit(1); }

const url = `webcal://${lan}:3000/feed/${slug}.ics`;
console.log(`\n${url}\n`);
console.log(await QR.toString(url, { type: 'terminal', small: true }));
await QR.toFile(`out/qr-${slug}.png`, url, { width: 600, margin: 2 });
console.log(`saved out/qr-${slug}.png`);
