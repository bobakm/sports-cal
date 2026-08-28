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
            <button class="btn copy" data-url="${esc(https)}">Other app</button>
          </div>
        </div>`;
}

export function renderIndex(
  site: string, teams: Team[], presets: Preset[], counts: Map<string, number>,
  bundleCounts: Map<string, number> = new Map(),
  alertCount = 0,
  localCount = 0,
): string {
  // Grouped by sport (so the icons cluster), alphabetical inside each group.
  const CATEGORY_ORDER: Team['category'][] = ['EPL', 'NHL', 'NCAAF', 'MLB', 'NATIONAL'];
  const live = teams
    .filter(t => (counts.get(t.slug) ?? 0) > 0)
    .sort((a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
      || a.name.localeCompare(b.name));
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
  .inapp { background:var(--warnbg); border:1px solid var(--warnline); color:var(--warn);
           border-radius:9px; padding:.75rem .9rem; font-size:.9rem; margin:0 0 1.5rem; }
  .inapp b { color:var(--warn); }
  .urlnote { font-size:.8rem; color:var(--dim); margin-top:.5rem; }
  .urlbox { width:100%; margin-top:.5rem; font:inherit; font-size:.8rem; padding:.4rem .5rem;
            border:1px solid var(--line); border-radius:6px; background:var(--bg); color:var(--fg); }
  .key { border:1px solid var(--line); border-radius:12px; padding:1rem 1.15rem; margin:0 0 1.75rem; }
  .key h3 { font-size:.78rem; text-transform:uppercase; letter-spacing:.09em; color:var(--dim);
            margin:0 0 .6rem; font-weight:600; }
  .key ul { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:.4rem; }
  .key li { font-size:.92rem; color:var(--dim); }
  .key li b { color:var(--fg); margin-right:.25rem; }
  .key > p { font-size:.86rem; color:var(--dim); margin:.75rem 0 0; padding-top:.6rem;
             border-top:1px solid var(--line); }
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

  <p class="pick"><b>Which button?</b> Go by the app you actually open, not the phone you own.<br>
  <b>Apple Calendar</b> — the calendar built into iPhone and Mac.<br>
  <b>Google Calendar</b> — including on an iPhone. Needs a computer, once.<br>
  <b>Other app</b> — Outlook, Fantastical, Samsung, anything else. Gives you a link to paste.</p>

  <p class="inapp" id="inapp"><b>Opened this from WhatsApp or Instagram?</b> Tap the <b>⋯</b> or <b>Share</b> icon and choose <b>Open in Safari</b> (or Chrome) first. Chat apps use a cut-down browser that silently blocks calendar subscriptions.</p>

  <div class="key">
    <h3>What the symbols mean</h3>
    <ul>
      <li><b>🔥</b> Two teams from this list playing <em>each other</em>.</li>
      <li><b>⭐</b> A big one — cup tie, knockout, tournament, ranked college matchup, or a heavyweight opponent.</li>
      <li><b>⚽ 🏒 🏈 ⚾ 🌍</b> The sport, so these sort together in your calendar sidebar.</li>
    </ul>
    <p>Finished games show the score in the title. Everything is in your own timezone.</p>
  </div>

  <div class="step">
    <h2><span class="num">1</span> Everything in one calendar</h2>
    <p>Simplest. One tap and you're done. The catch: it arrives as a <b>single calendar</b>, so you can't hide just one team later — it's all of it or none of it.</p>
    <div class="rows">
${everythingRow}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">2</span> Just the big days</h2>
    <p>No fixtures, just <b>all-day banners</b> on dates worth knowing about — two of your teams facing each other, a cup tie, a knockout, a ranked college matchup. Give this calendar its own colour and those days light up. Designed to layer on top of any of the others.</p>
    <div class="rows">
${alertCount ? row(site, 'alerts', '⭐ Big Days', `${alertCount} days`) : ''}
${localCount ? row(site, 'local', '🏟 Games You Could Go To', `${localCount} days · Houston & Dallas home`) : ''}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">3</span> Only when your teams meet</h2>
    <p>Deliberately sparse — <b>nothing but the games where two teams you follow face each other.</b> A handful of dates a year. These fixtures are already inside the bundles, so this is for people who want them called out on their own.</p>
    <div class="rows">
${h2hRows}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">4</span> One calendar per sport</h2>
    <p>A few taps. Each one lands as its <b>own calendar with its own on/off checkbox</b>, so you can hide all the baseball without touching the soccer.</p>
    <div class="rows">
${groupRows}
    </div>
  </div>

  <div class="step">
    <h2><span class="num">5</span> Pick individual teams</h2>
    <p>The most setup and the most control — <b>every team is a separate calendar</b> you can switch on and off whenever you like, right in your calendar's sidebar.</p>
    <div class="rows">
${teamRows}
    </div>
  </div>

  <p class="warn"><b>Pick one row from one section.</b> If you subscribe to “Everything” <em>and</em> a single team, those games land on your calendar twice.</p>

  <details>
    <summary>It's not working / help</summary>
    <p><b>I have an iPhone but use the Google Calendar app:</b> use the Google Calendar button, from a computer. The Apple button puts games into iOS's built-in Calendar app, which the Google Calendar app can't see — they'd be on your phone but invisible to you.</p>
    <p><b>Google Calendar:</b> add it once from a computer. The Google Calendar phone app can't add subscriptions at all, on any phone — that's a Google limitation, not a broken link. Once added, it syncs to your phone by itself.</p>
    <p><b>Apple Calendar (the built-in one):</b> tap “Apple Calendar” and confirm. That's the whole thing, and it works right on the phone.</p>
    <p><b>Outlook, Fantastical, anything else:</b> hit “Copy”, then paste it into your app's “subscribe from URL” option. Don't use “import” — that makes a dead copy that never updates.</p>
    <p><b>“Validation failed” or “invalid URL”:</b> make sure the address starts with <b>https://</b>. Some apps turn the Apple Calendar link into plain <code>http://</code> and then refuse to follow the redirect to the secure version. Hit “Copy”, which always gives you the <code>https://</code> form, and paste that instead.</p>
    <p><b>Nothing showed up yet:</b> new subscriptions take a few minutes to fill in.</p>
    <p><b>A game time looks wrong:</b> Apple re-checks every few hours, Google can take considerably longer, and there's no way to hurry either. Times are always shown in your own timezone.</p>
    <p><b>Where did they go?</b> These arrive under “Subscriptions” on Apple and “Other calendars” on Google, not with your personal calendars.</p>
    <p><b>TV info</b> is best-effort. Networks often don't announce until closer to game day, so it fills in over time.</p>
  </details>
</main>
<script>
  // Chat-app browsers (WhatsApp, Instagram, Messenger) block webcal:// handoff
  // and often the clipboard too. Surface the warning only where it applies.
  (function () {
    var ua = navigator.userAgent || '';
    var inApp = /FBAN|FBAV|Instagram|Line|WhatsApp|Messenger|Snapchat/i.test(ua)
      || (/iPhone|iPad/.test(ua) && !/Safari/.test(ua));
    if (!inApp) { var w = document.getElementById('inapp'); if (w) w.style.display = 'none'; }
  })();

  // Always leave a way to get the URL, even with no clipboard access.
  // Always show the https link as selectable text. Copying alone is invisible,
  // and it's the https form that matters: apps that rewrite webcal:// to plain
  // http:// hit a redirect some of them refuse to follow.
  function reveal(btn, copied) {
    var row = btn.closest('.row');
    if (row.querySelector('.urlbox')) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'flex-basis:100%';
    var note = document.createElement('div');
    note.className = 'urlnote';
    note.textContent = copied
      ? 'Copied. Paste this into your app\u2019s \u201csubscribe from URL\u201d box \u2014 it must start with https://'
      : 'Copy this into your app\u2019s \u201csubscribe from URL\u201d box \u2014 it must start with https://';
    var i = document.createElement('input');
    i.className = 'urlbox'; i.value = btn.dataset.url; i.readOnly = true;
    i.addEventListener('focus', function () { i.select(); });
    wrap.appendChild(note); wrap.appendChild(i);
    row.appendChild(wrap);
    i.focus(); i.select();
  }
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(b.dataset.url)
          .then(function () { reveal(b, true); }, function () { reveal(b, false); });
      } catch (e) { reveal(b, false); }
    });
  });
</script>
</body>
</html>
`;
}
