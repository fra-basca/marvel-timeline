#!/usr/bin/env python3
"""Recupera da Wikipedia (inglese) la locandina di ogni titolo in data.js
e genera posters.js. Non serve nessun account o token.

Uso (dalla cartella del progetto):
    python3 scripts/fetch_posters.py

Se un titolo resta senza locandina, correggi il campo "wiki" in data.js
con il nome esatto della pagina su en.wikipedia.org e rilancia lo script.
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "marvel-timeline-script/1.0"}


def load_titles():
    text = (ROOT / "data.js").read_text(encoding="utf-8")
    start = text.index("[", text.index("const TITLES"))
    end = text.rindex("]")
    return json.loads(text[start:end + 1])


def fetch_images(pages):
    """Restituisce {titolo pagina richiesto: url immagine}."""
    found = {}
    for i in range(0, len(pages), 40):  # l'API accetta max 50 titoli per richiesta
        chunk = pages[i:i + 40]
        query = urllib.parse.urlencode({
            "action": "query", "format": "json", "redirects": 1,
            "prop": "pageimages", "piprop": "original|thumbnail",
            "pithumbsize": 400, "pilicense": "any",
            "titles": "|".join(chunk),
        })
        req = urllib.request.Request(f"{API}?{query}", headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)["query"]

        alias = {}
        for key in ("normalized", "redirects"):
            for x in data.get(key, []):
                alias[x["from"]] = x["to"]
        by_title = {p["title"]: p for p in data["pages"].values()}

        for name in chunk:
            final = name
            while final in alias:
                final = alias[final]
            page = by_title.get(final, {})
            img = page.get("thumbnail") or page.get("original")
            if img:
                found[name] = img["source"].split("?")[0]
    return found


def main():
    titles = load_titles()
    images = fetch_images(sorted({t["wiki"] for t in titles if t.get("wiki")}))

    posters, missing = {}, []
    for t in titles:
        url = images.get(t.get("wiki"))
        if url:
            posters[t["id"]] = url
        else:
            missing.append(t["title"])

    out = ("// File generato da scripts/fetch_posters.py — non modificarlo a mano.\n"
           "const POSTERS = " + json.dumps(posters, indent=2, ensure_ascii=False) + ";\n")
    (ROOT / "posters.js").write_text(out, encoding="utf-8")

    print(f"posters.js aggiornato: {len(posters)} locandine trovate.")
    for title in missing:
        print(f"  ✗ manca: {title}")


if __name__ == "__main__":
    main()
