// RFC 5545 conformance check on every generated feed, using an INDEPENDENT
// parser (ical.js — the one Thunderbird uses) rather than trusting the library
// that wrote the file. Runs in the build: a feed that fails here never deploys.
import { readdirSync, readFileSync } from 'node:fs';
import ICAL from 'ical.js';

const DIR = 'site/feed';
type Problem = { feed: string; issue: string };
const problems: Problem[] = [];
const note = (feed: string, issue: string) => problems.push({ feed, issue });

const files = readdirSync(DIR).filter(f => f.endsWith('.ics')).sort();
if (!files.length) { console.error('no feeds to validate'); process.exit(1); }

for (const file of files) {
  const raw = readFileSync(`${DIR}/${file}`);
  const text = raw.toString('utf8');

  // --- byte-level rules a generator can silently get wrong ---
  if (!raw.subarray(-2).equals(Buffer.from('\r\n')))
    note(file, 'does not end with CRLF (RFC 5545 §3.1)');
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const bareLF = (text.match(/(?<!\r)\n/g) ?? []).length;
  const bareCR = (text.match(/\r(?!\n)/g) ?? []).length;
  if (bareLF) note(file, `${bareLF} bare LF line ending(s)`);
  if (bareCR) note(file, `${bareCR} bare CR line ending(s)`);
  if (!crlf) note(file, 'no CRLF line endings at all');
  for (const [i, line] of text.split('\r\n').entries())
    if (Buffer.byteLength(line, 'utf8') > 75)
      note(file, `line ${i + 1} is ${Buffer.byteLength(line, 'utf8')} octets (must fold at 75)`);
  if (raw[0] === 0xef) note(file, 'starts with a UTF-8 BOM');

  // --- does an independent parser accept it? ---
  let comp: any;
  try {
    comp = new ICAL.Component(ICAL.parse(text));
  } catch (e) {
    note(file, `PARSE FAILED: ${(e as Error).message}`);
    continue;
  }
  if (comp.name !== 'vcalendar') { note(file, `root is ${comp.name}, not vcalendar`); continue; }
  if (!comp.getFirstPropertyValue('version')) note(file, 'missing VERSION');
  if (!comp.getFirstPropertyValue('prodid')) note(file, 'missing PRODID');

  const events = comp.getAllSubcomponents('vevent');
  // An empty calendar is valid: a team can genuinely have nothing scheduled.
  if (!events.length) console.log(`  \u2139\ufe0f  ${file} has no events (nothing scheduled)`);

  const uids = new Set<string>();
  for (const ev of events) {
    const uid = ev.getFirstPropertyValue('uid');
    if (!uid) { note(file, 'an event has no UID'); continue; }
    if (uids.has(String(uid))) note(file, `duplicate UID: ${uid}`);
    uids.add(String(uid));

    if (!ev.getFirstPropertyValue('summary')) note(file, `${uid}: no SUMMARY`);
    if (!ev.getFirstPropertyValue('dtstamp')) note(file, `${uid}: no DTSTAMP`);

    const dtstart = ev.getFirstProperty('dtstart');
    if (!dtstart) { note(file, `${uid}: no DTSTART`); continue; }
    const t = dtstart.getFirstValue() as any;
    // Timed events must be explicit UTC or carry a TZID — never floating.
    if (!t.isDate && !t.zone?.tzid && !t.zone?.isUTC && !dtstart.getParameter('tzid'))
      note(file, `${uid}: floating DTSTART (no Z, no TZID)`);
    if (!t.isDate) {
      const end = ev.getFirstPropertyValue('dtend') as any;
      if (end && end.toJSDate() <= t.toJSDate()) note(file, `${uid}: DTEND not after DTSTART`);
    }
  }
}

const width = Math.max(...files.map(f => f.length));
for (const f of files) {
  const mine = problems.filter(p => p.feed === f);
  console.log(`  ${mine.length ? '❌' : '✅'} ${f.padEnd(width)}  ${mine.length ? mine.length + ' problem(s)' : 'ok'}`);
  for (const p of mine.slice(0, 5)) console.log(`       ${p.issue}`);
}
console.log(`\n${files.length} feeds, ${problems.length} problems`);
if (problems.length) process.exit(1);
