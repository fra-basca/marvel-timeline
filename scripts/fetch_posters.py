#!/usr/bin/env python3
"""Scarica da TMDB l'URL della locandina di ogni titolo in data.js
e genera posters.js.

Uso:
    export TMDB_TOKEN="il-tuo-API-Read-Access-Token"
    python3 scripts/fetch_posters.py

Il token si ottiene gratis da https://www.themoviedb.org/settings/api
(serve solo per lanciare lo script: non finisce nel sito pubblicato).
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p/w342"

TOKEN = os.environ.get("TMDB_TOKEN")
if not TOKEN:
    sys.exit("Imposta la variabile d'ambiente TMDB_TOKEN (API Read Access Token di TMDB).")


def get(path, **params):
    params.setdefault("language", "it-IT")
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def load_titles():
    text = (ROOT / "data.js").read_text(encoding="utf-8")
    start = text.index("[", text.index("const TITLES"))
    end = text.rindex("]")
    return json.loads(text[start:end + 1])


def find_poster(item):
    query = item.get("original", item["title"])
    if item["type"] == "serie":
        results = get("/search/tv", query=query)["results"]
        if not results:
            return None
        show = results[0]
        if "season" in item:
            season = get(f"/tv/{show['id']}/season/{item['season']}")
            if season.get("poster_path"):
                return season["poster_path"]
        return show.get("poster_path")

    # film e speciali
    results = get("/search/movie", query=query, year=item["year"])["results"]
    if not results:
        results = get("/search/movie", query=query)["results"]
    return results[0].get("poster_path") if results else None


def main():
    posters, missing = {}, []
    for item in load_titles():
        try:
            path = find_poster(item)
        except Exception as e:  # rete, rate limit, ecc.
            print(f"  ! {item['title']}: {e}")
            path = None
        if path:
            posters[item["id"]] = IMG + path
            print(f"  ✓ {item['title']}")
        else:
            missing.append(item["title"])
            print(f"  ✗ {item['title']} (nessuna locandina trovata)")

    out = ("// File generato da scripts/fetch_posters.py — non modificarlo a mano.\n"
           "const POSTERS = " + json.dumps(posters, indent=2, ensure_ascii=False) + ";\n")
    (ROOT / "posters.js").write_text(out, encoding="utf-8")
    print(f"\nposters.js aggiornato: {len(posters)} locandine, {len(missing)} mancanti.")


if __name__ == "__main__":
    main()
