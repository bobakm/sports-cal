export {};
// Why aren't scores appearing? Dump the shape of a COMPLETED game.
const U = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/hou/schedule';
const H = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' };
const d: any = await (await fetch(U, { headers: H })).json();
const selfId = String(d?.team?.id);
console.log('team.id =', selfId);

const past = (d.events ?? []).filter((e: any) => new Date(e.date) < new Date()).slice(-2);
for (const ev of past) {
  const c = (ev.competitions ?? [])[0];
  console.log('\n--- ', ev.date, ev.shortName, '---');
  console.log('event.status      :', JSON.stringify(ev.status)?.slice(0, 160));
  console.log('competition.status:', JSON.stringify(c?.status)?.slice(0, 160));
  for (const comp of c?.competitors ?? []) {
    console.log(`  competitor id=${comp?.team?.id} homeAway=${comp?.homeAway} ` +
                `winner=${comp?.winner} score=${JSON.stringify(comp?.score)}`);
  }
  console.log('  competition keys:', Object.keys(c ?? {}).join(','));
}
