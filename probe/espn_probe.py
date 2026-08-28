#!/usr/bin/env python3
"""Step-2 data-shape probe: hit ESPN's public endpoints, report availability.
Uses curl (ESPN 403s python-urllib)."""
import json, subprocess, sys

BASE = "https://site.api.espn.com/apis/site/v2/sports"

def get(url):
    p = subprocess.run(["curl","-sS","--compressed","--max-time","30",url],
                       capture_output=True, text=True)
    if p.returncode != 0:
        return None, f"curl rc={p.returncode}"
    try:
        return json.loads(p.stdout), None
    except json.JSONDecodeError:
        return None, f"non-JSON ({len(p.stdout)}B): {p.stdout[:80]!r}"

def summarize_schedule(label, url):
    data, err = get(url)
    if err:
        print(f"  {label:26} FAIL  {err}")
        return None
    evs = data.get("events") or []
    team = (data.get("team") or {}).get("displayName") or "?"
    bc_n, bc_ex = 0, None
    for e in evs:
        c = (e.get("competitions") or [{}])[0]
        b = c.get("broadcasts") or []
        if b:
            bc_n += 1
            if bc_ex is None: bc_ex = b
    print(f"  {label:26} OK    team={team!r} events={len(evs)} broadcasts={bc_n}/{len(evs)}")
    if bc_ex is not None:
        print(f"      broadcast shape: {json.dumps(bc_ex)[:160]}")
    return data

print("=== A. Club / college team schedules ===")
for label, url in [
    ("EPL / Man Utd",   f"{BASE}/soccer/eng.1/teams/360/schedule"),
    ("NHL / Canucks",   f"{BASE}/hockey/nhl/teams/van/schedule"),
    ("NCAAF / Houston", f"{BASE}/football/college-football/teams/248/schedule"),
    ("MLB / Astros",    f"{BASE}/baseball/mlb/teams/hou/schedule"),
]:
    summarize_schedule(label, url)

print()
print("=== B. National-team competition discovery ===")
LEAGUES = ["fifa.world","fifa.worldq.afc","fifa.worldq.uefa","fifa.worldq.concacaf",
           "fifa.friendly","fifa.friendly.w","afc.asian","uefa.nations",
           "fifa.wwc","concacaf.gold"]
WANT = ["iran","united states","usa","belgium","england","italy","netherlands"]
for lg in LEAGUES:
    data, err = get(f"{BASE}/soccer/{lg}/teams")
    if err:
        print(f"  {lg:22} FAIL  {err}")
        continue
    teams = []
    for s in data.get("sports", []):
        for l in s.get("leagues", []):
            for t in l.get("teams", []):
                tt = t.get("team", {})
                teams.append((tt.get("id"), tt.get("displayName","")))
    hits = [f"{n}(id={i})" for i, n in teams if any(w in (n or "").lower() for w in WANT)]
    print(f"  {lg:22} OK    teams={len(teams):4}  matches: {', '.join(hits) if hits else '(none)'}")
