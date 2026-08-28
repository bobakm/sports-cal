# Sports Calendar

Subscribable calendar feeds for a specific set of teams, plus combined bundles.
Static files regenerated every 6 hours by GitHub Actions and served from Pages —
no server, no database, no accounts.

**Subscribe page:** https://bobakm.github.io/sports-calendar

## How it works

`scripts/build.ts` fetches fixtures from ESPN's public endpoints, generates one
`.ics` per team plus one per bundle, and writes everything to `site/`. The Action
publishes that to Pages. Calendar apps re-fetch the URL on their own schedule.

## Adding a team

Add a row to `lib/teams.ts`. Club and college teams need one source; national
teams need one per competition they appear in — ESPN has no endpoint that
returns all of a national team's fixtures at once.

Bundles live in `lib/presets.ts`.

## Notes for future me

- ESPN's soccer endpoints return **completed** matches bare and **upcoming**
  ones only under `?fixture=true`. They are disjoint. Query both.
- Broadcast info fills in as games approach; NHL publishes almost none until the
  season starts, which is what `defaultBroadcast` covers.
- The build **fails on purpose** if fewer than half the teams return fixtures.
  A valid-but-empty feed makes calendar clients delete events they already have.

## Local

    npm install
    npm run build     # writes site/
    npm run serve     # local server on :3000
    npm run gen cal   # single feed to out/
