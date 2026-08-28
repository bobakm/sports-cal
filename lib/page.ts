import type { Team } from './teams.ts';
import type { Preset } from './presets.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Google's add-by-URL deep link. Apple/iOS handles webcal:// directly. */
const googleUrl = (https: string) =>
  `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(https)}`;

function row(site: string, slug: string, label: string, sub: string): string {
  const https = `https://${site}/feed/${slug}.ics`;
  const webcal = `webcal://${site}/feed/${slug}.ics`;
  return `      <div class="row">
        <div class="who"><strong>${esc(label)}</strong><span>${esc(sub)}</span></div>
        <div class="acts">
          <a class="btn primary" href="${esc(webcal)}">Apple / iPhone</a>
          <a class="btn" href="${esc(googleUrl(https))}" target="_blank" rel="noopener">Google</a>
          <button class="btn copy" data-url="${esc(https)}">Copy link</button>
        </div>
      </div>`;
}

export function renderIndex(
  site: string, teams: Team[], presets: Preset[], counts: Map<string, number>,
): string {
  const presetRows = presets.map(p => {
    const n = p.teams.reduce((a, s) => a + (counts.get(s) ?? 0), 0);
    return row(site, p.slug, p.name, `${p.teams.length} teams · ${n} games`);
  }).join('\n');

  const teamRows = teams
    .filter(t => (counts.get(t.slug) ?? 0) > 0)
    .map(t => row(site, t.slug, t.name, `${counts.get(t.slug)} games`))
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sports Calendar</title>
<style>
  :root { --bg:#fff; --fg:#16181d; --dim:#666e7a; --line:#e3e6ea; --accent:#1a56db; --card:#f7f8fa; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14161a; --fg:#e8eaed; --dim:#9aa3af; --line:#282c33; --accent:#7aa2f7; --card:#1c1f25; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:2rem 1rem 4rem; background:var(--bg); color:var(--fg);
         font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
  main { max-width: 46rem; margin: 0 auto; }
  h1 { font-size:1.6rem; margin:0 0 .35rem; letter-spacing:-.02em; }
  .lede { color:var(--dim); margin:0 0 2rem; }
  h2 { font-size:.78rem; text-transform:uppercase; letter-spacing:.09em; color:var(--dim);
       margin:2.25rem 0 .6rem; font-weight:600; }
  .row { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; justify-content:space-between;
         padding:.8rem .95rem; border:1px solid var(--line); border-radius:10px;
         background:var(--card); margin-bottom:.5rem; }
  .who { display:flex; flex-direction:column; min-width:9rem; }
  .who span { color:var(--dim); font-size:.82rem; }
  .acts { display:flex; gap:.4rem; flex-wrap:wrap; }
  .btn { font:inherit; font-size:.85rem; padding:.4rem .7rem; border-radius:7px; cursor:pointer;
         border:1px solid var(--line); background:var(--bg); color:var(--fg); text-decoration:none;
         white-space:nowrap; }
  .btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
  .btn:hover { opacity:.85; }
  details { margin-top:2.5rem; border-top:1px solid var(--line); padding-top:1rem; }
  summary { cursor:pointer; color:var(--dim); font-size:.9rem; }
  details p, details li { color:var(--dim); font-size:.9rem; }
  code { background:var(--card); padding:.1rem .3rem; border-radius:4px; font-size:.85em; }
</style>
</head>
<body>
<main>
  <h1>Sports Calendar</h1>
  <p class="lede">Pick what you want and tap one button. Games appear in your calendar and keep themselves up to date — you never have to come back here.</p>

  <h2>Bundles</h2>
${presetRows}

  <h2>Individual teams</h2>
${teamRows}

  <details>
    <summary>Having trouble?</summary>
    <p><strong>Google Calendar users:</strong> you have to add this once from a computer — the Google Calendar phone app can't add subscriptions at all. It syncs to your phone right after.</p>
    <p><strong>iPhone / Mac:</strong> tap “Apple / iPhone” and confirm. That's it.</p>
    <p><strong>Anything else</strong> (Outlook, Fantastical): hit “Copy link” and paste it into your app's “subscribe from URL” option.</p>
    <p><strong>Don't pick a bundle and its individual teams</strong> — you'll see every game twice.</p>
    <p>New subscriptions take a few minutes to fill in. After that, Apple checks for updates every few hours; Google can take considerably longer, and there's no way to hurry it.</p>
    <p>TV info is best-effort and often isn't announced until closer to game day.</p>
  </details>
</main>
<script>
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(b.dataset.url).then(function () {
        var t = b.textContent; b.textContent = 'Copied';
        setTimeout(function () { b.textContent = t; }, 1200);
      });
    });
  });
</script>
</body>
</html>
`;
}
