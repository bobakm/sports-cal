import { ICON, type Team } from './teams.ts';
import { h2hSlug, h2hName, type Preset } from './presets.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const googleUrl = (https: string) =>
  `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(https)}`;

function row(site: string, slug: string, label: string, sub: string): string {
  const https = `https://${site}/feed/${slug}.ics`;
  return `        <div class="row">
          <div class="who"><strong>${esc(label)}</strong><span>${esc(sub)}</span></div>
          <div class="acts">
            <a class="btn primary" href="${esc(`webcal://${site}/feed/${slug}.ics`)}">Apple Calendar</a>
            <a class="btn" href="${esc(googleUrl(https))}" target="_blank" rel="noopener">Google Calendar</a>
            <button class="btn copy" data-url="${esc(https)}">Copy</button>
          </div>
        </div>`;
}

export function renderIndex(
  site: string, teams: Team[], presets: Preset[], counts: Map<string, number>,
  bundleCounts: Map<string, number> = new Map(),
  alertCount = 0,
): string {
  const live = teams.filter(t => (counts.get(t.slug) ?? 0) > 0);
  const everything = presets.find(p => p.slug === 'everything');
  const groups = presets.filter(p => p.slug !== 'everything');

  const bundleGames = (p: Preset) =>
    bundleCounts.get(p.slug) ?? p.teams.reduce((a, s) => a + (counts.get(s) ?? 0), 0);

  const everythingRow = everything
    ? row(site, everything.slug, 'Everything',
          `${live.length} teams · ${bundleGames(everything)} games`)
    : '';

  const groupRows = groups.map(p =>
    row(site, p.slug, p.name,
        `${p.teams.length} team${p.teams.length === 1 ? '' : 's'} · ${bundleGames(p)} games`))
    .join('\n');

  const h2hRows = [everything, ...groups]
    .filter((p): p is Preset => !!p && (bundleCounts.get(h2hSlug(p)) ?? 0) > 0)
    .map(p => row(site, h2hSlug(p), h2hName(p), `${bundleCounts.get(h2hSlug(p))} games`))
    .join('\n');

  const teamRows = live.map(t =>
    row(site, t.slug, `${ICON[t.category]} ${t.name}`, `${counts.get(t.slug)} games`)).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sports Calendar</title>
<style>
  :root { --bg:#fff; --fg:#16181d; --dim:#5f6773; --line:#e3e6ea; --accent:#1a56db;
          --card:#f7f8fa; --warn:#8a5a00; --warnbg:#fff8e6; --warnline:#f0dca8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14161a; --fg:#e8eaed; --dim:#98a1ad; --line:#282c33; --accent:#7aa2f7;
            --card:#1c1f25; --warn:#e8c37a; --warnbg:#241f14; --warnline:#4a3f26; }
  }
  * { box-sizing:border-box; }
  body { margin:0; padding:2.25rem 1rem 5rem; background:var(--bg); color:var(--fg);
         font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
  main { max-width:44rem; margin:0 auto; }
  h1 { font-size:1.7rem; margin:0 0 .4rem; letter-spacing:-.02em; }
  .lede { color:var(--dim); margin:0 0 2.5rem; font-size:1.02rem; }
  .step { border:1px solid var(--line); border-radius:12px; padding:1.1rem 1.15rem;
          margin-bottom:1rem; background:var(--bg); }
  .step > h2 { font-size:1.05rem; margin:0 0 .2rem; display:flex; gap:.5rem; align-items:baseline; }
  .num { display:inline-flex; align-items:center; justify-content:center; flex:none;
         width:1.5rem; height:1.5rem; border-radius:50%; background:var(--accent); color:#fff;
         font-size:.8rem; font-weight:700; }
  .step > p { color:var(--dim); font-size:.92rem; margin:.15rem 0 .9rem 2rem; }
  .step > p b { color:var(--fg); font-weight:600; }
  .rows { display:flex; flex-direction:column; gap:.4rem; }
  .row { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; justify-content:space-between;
         padding:.6rem .8rem; border:1px solid var(--line); border-radius:9px; background:var(--card); }
  .who { display:flex; flex-direction:column; min-width:8rem; }
  .who span { color:var(--dim); font-size:.8rem; }
  .acts { display:flex; gap:.35rem; flex-wrap:wrap; }
  .btn { font:inherit; font-size:.83rem; padding:.35rem .65rem; border-radius:6px; cursor:pointer;
         border:1px solid var(--line); background:var(--bg); color:var(--fg);
         text-decoration:none; white-space:nowrap; }
  .btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
  .btn:hover { opacity:.85; }
  .pick { background:var(--card); border:1px solid var(--line); border-radius:9px;
          padding:.7rem .9rem; font-size:.9rem; color:var(--dim); margin:0 0 2rem; }
  .pick b { color:var(--fg); }
  .warn { background:var(--warnbg); border:1px solid var(--warnline); color:var(--warn);
          border-radius:9px; padding:.75rem .9rem; font-size:.9rem; margin:1.75rem 0 0; }
  details { margin-top:2rem; border-top:1px solid var(--line); padding-top:1.1rem; }
  summary { cursor:pointer; color:var(--dim); font-size:.92rem; }
  details p { color:var(--dim); font-size:.9rem; }
  details b { color:var(--fg); }
</style>
</head>
<body>
<main>
  <h1>Sports Calendar</h1>
  <p class="lede">Tap once and the games show up in your own calendar app — and keep updating themselves. You never have to come back here.</p>

  <p class="pick"><b>Which button?</b> Go by the app you actually open, not the phone you own. If you use the <b>Google Calendar app on an iPhone</b>, you want <b>Google Calendar</b> — and you'll need a computer for it, just once.</p>

  <div class="step">
    <h2><span class="num">1</span> Everything in one calendar</h2>
    <p>Simplest. One tap and you're done. The catch: it arrives as a <b>single calendar</b>, so you can't hide just one team later — it's all of it or none of it.</p>
    <div class="rows">
${everythingRow}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">2</span> One calendar per sport</h2>
    <p>A few taps. Each one lands as its <b>own calendar with its own on/off checkbox</b>, so you can hide all the baseball without touching the soccer.</p>
    <div class="rows">
${groupRows}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">3</span> Pick individual teams</h2>
    <p>The most setup and the most control — <b>every team is a separate calendar</b> you can switch on and off whenever you like, right in your calendar's sidebar.</p>
    <div class="rows">
${teamRows}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">4</span> Just the big days</h2>
    <p>Not every game — only the days worth clearing your evening for: two of your teams playing each other, a cup tie, or three-plus games stacked on one day. They arrive as <b>all-day banners</b>, so give this calendar its own colour and key days light up.</p>
    <div class="rows">
${alertCount ? row(site, 'alerts', '🔥 Sports Days', `${alertCount} days flagged`) : ''}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">5</span> Only when your teams meet</h2>
    <p>Deliberately sparse — <b>nothing but the games where two teams you follow face each other.</b> A handful of dates a year. Good as a second calendar alongside anything above; these fixtures are already included in the bundles, so this one is for people who want them called out separately.</p>
    <div class="rows">
${h2hRows}
    </div>
  </div>

  <p class="warn"><b>Pick one row from one section.</b> If you subscribe to “Everything” <em>and</em> a single team, those games land on your calendar twice.</p>

  <details>
    <summary>It's not working / help</summary>
    <p><b>I have an iPhone but use the Google Calendar app:</b> use the Google Calendar button, from a computer. The Apple button puts games into iOS's built-in Calendar app, which the Google Calendar app can't see — they'd be on your phone but invisible to you.</p>
    <p><b>Google Calendar:</b> add it once from a computer. The Google Calendar phone app can't add subscriptions at all, on any phone — that's a Google limitation, not a broken link. Once added, it syncs to your phone by itself.</p>
    <p><b>Apple Calendar (the built-in one):</b> tap “Apple Calendar” and confirm. That's the whole thing, and it works right on the phone.</p>
    <p><b>Outlook, Fantastical, anything else:</b> hit “Copy”, then paste it into your app's “subscribe from URL” option. Don't use “import” — that makes a dead copy that never updates.</p>
    <p><b>Nothing showed up yet:</b> new subscriptions take a few minutes to fill in.</p>
    <p><b>A game time looks wrong:</b> Apple re-checks every few hours, Google can take considerably longer, and there's no way to hurry either. Times are always shown in your own timezone.</p>
    <p><b>Where did they go?</b> These arrive under “Subscriptions” on Apple and “Other calendars” on Google, not with your personal calendars.</p>
    <p><b>TV info</b> is best-effort. Networks often don't announce until closer to game day, so it fills in over time.</p>
  </details>
</main>
<script>
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(b.dataset.url).then(function () {
        var t = b.textContent; b.textContent = 'Copied'; b.classList.add('primary');
        setTimeout(function () { b.textContent = t; b.classList.remove('primary'); }, 1200);
      });
    });
  });
</script>
</body>
</html>
`;
}
