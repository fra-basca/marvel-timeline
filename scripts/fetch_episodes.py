#!/usr/bin/env python3
"""Scarica da TVmaze l'elenco degli episodi di ogni stagione in data.js
(numero, titolo, durata, data di uscita) e genera episodes.js.

Serve per il "tempo di visione" (durata dei singoli episodi) e confronta il
numero di episodi con quello scritto in data.js, segnalando le differenze.
Non serve nessun account o token.

Uso (dalla cartella del progetto):
    python3 scripts/fetch_episodes.py
"""
import json
import time
import urllib.parse
from pathlib import Path

from fetch_posters import (ROOT, TVMAZE_API, get_json, load_titles,
                           season_number, series_name)


def find_show(name, first_year):
    """Cerca la serie su TVmaze, scegliendo quella uscita nell'anno giusto."""
    results = get_json(f"{TVMAZE_API}/search/shows?q={urllib.parse.quote(name)}")
    time.sleep(0.6)  # TVmaze consente circa 20 richieste ogni 10 secondi
    for r in results:
        if (r["show"].get("premiered") or "")[:4] == first_year:
            return r["show"]
    return None


def main():
    titles = load_titles()
    series = [t for t in titles if t["type"] == "serie"]

    first_year = {}
    for t in series:
        name = series_name(t)
        first_year[name] = min(first_year.get(name, "9999"), t["date"][:4])

    shows, episodes, problems = {}, {}, []
    for t in series:
        name = series_name(t)
        if name not in shows:
            show = find_show(name, first_year[name])
            if show:
                show["episodes"] = get_json(f"{TVMAZE_API}/shows/{show['id']}/episodes")
                time.sleep(0.6)
            shows[name] = show

        show = shows[name]
        if not show:
            problems.append(f"{t['title']}: serie non trovata su TVmaze")
            continue

        season = season_number(t)
        eps = [e for e in show["episodes"] if e["season"] == season and e.get("number")]
        fallback = show.get("averageRuntime") or show.get("runtime")
        episodes[t["id"]] = [{
            "n": e["number"],
            "title": e.get("name") or f"Episodio {e['number']}",
            "minutes": e.get("runtime") or fallback,
            "date": e.get("airdate") or None,
        } for e in sorted(eps, key=lambda e: e["number"])]

        if len(eps) != t.get("episodes"):
            problems.append(f"{t['title']}: data.js dice {t.get('episodes')} episodi, TVmaze {len(eps)}")

    out = ("// File generato da scripts/fetch_episodes.py — non modificarlo a mano.\n"
           "// Episodi di ogni stagione (da TVmaze): n = numero, minutes = durata, date = uscita.\n"
           "const EPISODES = {\n" +
           ",\n".join(f"  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in episodes.items()) +
           "\n};\n")
    (ROOT / "episodes.js").write_text(out, encoding="utf-8")

    total = sum(e["minutes"] or 0 for eps in episodes.values() for e in eps)
    print(f"episodes.js aggiornato: {len(episodes)} stagioni, "
          f"{sum(len(v) for v in episodes.values())} episodi, {total // 60} ore in tutto.")
    for p in problems:
        print(f"  ! {p}")


if __name__ == "__main__":
    main()
