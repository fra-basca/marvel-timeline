#!/usr/bin/env python3
"""Scarica la locandina di ogni titolo in data.js nella cartella assets/posters/
(ridimensionata e compressa) e genera posters.js con i percorsi locali.
Non serve nessun account o token. Funziona su Mac (usa "sips", già incluso in macOS).

Fonti:
  1. Wikipedia (inglese), per tutti i titoli.
  2. TVmaze (api.tvmaze.com), per le serie per cui Wikipedia ha solo il logo
     orizzontale o nessuna immagine: TVmaze ha le locandine verticali,
     spesso una per ogni stagione.

Uso (dalla cartella del progetto):
    python3 scripts/fetch_posters.py           # scarica solo le locandine nuove o cambiate
    python3 scripts/fetch_posters.py --force   # riscarica tutto

Se un titolo resta senza locandina:
  - film: correggi il campo "wiki" in data.js con il nome esatto della pagina su en.wikipedia.org;
  - serie: controlla che "original" (o il titolo) corrisponda al nome della serie in inglese.
Poi rilancia lo script.
"""
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI_API = "https://en.wikipedia.org/w/api.php"
TVMAZE_API = "https://api.tvmaze.com"
HEADERS = {"User-Agent": "marvel-timeline-script/1.0"}
SEASON_SUFFIX = re.compile(r"\s+–\s+Stagione\s+(\d+)$")

POSTER_DIR = ROOT / "assets" / "posters"
SOURCES_FILE = POSTER_DIR / "sources.json"  # da quale indirizzo viene ogni locandina
MAX_SIDE = 600     # lato lungo in pixel: 400×600 basta per schermi Retina
JPEG_QUALITY = 72


def get_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def download(url, dest):
    """Scarica un file, aspettando e riprovando se il server chiede di rallentare."""
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as r:
                dest.write_bytes(r.read())
            return
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 4:
                raise
            time.sleep(int(e.headers.get("Retry-After", "5")) + 1)


def save_local(poster_id, url, tmp):
    """Scarica l'immagine e la salva come assets/posters/<id>.jpg, ridimensionata."""
    raw = Path(tmp) / f"{poster_id}.download"
    out = POSTER_DIR / f"{poster_id}.jpg"
    download(url, raw)
    subprocess.run(
        ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(JPEG_QUALITY),
         "-Z", str(MAX_SIDE), str(raw), "--out", str(out)],
        check=True, capture_output=True,
    )
    raw.unlink()


def load_titles():
    text = (ROOT / "data.js").read_text(encoding="utf-8")
    start = text.index("[", text.index("const TITLES"))
    end = text.index("];", start)
    return json.loads(text[start:end + 1])


# ---------- 1. Wikipedia ----------
def wikipedia_images(pages):
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
        data = get_json(f"{WIKI_API}?{query}")["query"]

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


# ---------- 2. TVmaze (solo serie) ----------
def series_name(t):
    return t.get("original") or SEASON_SUFFIX.sub("", t["title"])


def season_number(t):
    if t.get("season"):
        return t["season"]
    m = SEASON_SUFFIX.search(t["title"])
    return int(m.group(1)) if m else 1


def tvmaze_posters(series, all_titles):
    """Per ogni serie restituisce {id titolo: url locandina} presi da TVmaze."""
    # Anno della prima stagione di ogni serie, per scegliere la serie giusta tra gli omonimi
    first_year = {}
    for t in all_titles:
        if t["type"] == "serie":
            name = series_name(t)
            first_year[name] = min(first_year.get(name, "9999"), t["date"][:4])

    shows, found = {}, {}
    for t in series:
        name = series_name(t)
        if name not in shows:
            results = get_json(f"{TVMAZE_API}/search/shows?q={urllib.parse.quote(name)}")
            time.sleep(0.6)  # TVmaze consente circa 20 richieste ogni 10 secondi
            match = [r["show"] for r in results
                     if (r["show"].get("premiered") or "")[:4] == first_year[name]]
            show = match[0] if match else None
            if show:
                show["seasons"] = get_json(f"{TVMAZE_API}/shows/{show['id']}/seasons")
                time.sleep(0.6)
            shows[name] = show

        show = shows[name]
        if not show:
            continue
        season = next((s for s in show["seasons"] if s["number"] == season_number(t)), None)
        image = (season or {}).get("image") or show.get("image")
        if image:
            found[t["id"]] = image["original"]
    return found


def main():
    force = "--force" in sys.argv
    titles = load_titles()
    wiki = wikipedia_images(sorted({t["wiki"] for t in titles if t.get("wiki")}))

    urls = {}
    for t in titles:
        url = wiki.get(t.get("wiki"))
        if url:
            urls[t["id"]] = url

    # Serie con solo il logo (o senza immagine) su Wikipedia → TVmaze
    to_fix = [t for t in titles
              if t["type"] == "serie" and "logo" in urls.get(t["id"], "logo").lower()]
    from_tvmaze = tvmaze_posters(to_fix, titles)
    urls.update(from_tvmaze)

    # Scarica in locale solo ciò che manca o è cambiato
    POSTER_DIR.mkdir(parents=True, exist_ok=True)
    sources = json.loads(SOURCES_FILE.read_text()) if SOURCES_FILE.exists() else {}
    downloaded, failed = 0, []
    with tempfile.TemporaryDirectory() as tmp:
        for poster_id, url in urls.items():
            local = POSTER_DIR / f"{poster_id}.jpg"
            if not force and local.exists() and sources.get(poster_id) == url:
                continue
            try:
                save_local(poster_id, url, tmp)
                sources[poster_id] = url
                downloaded += 1
                time.sleep(0.3)
            except Exception as e:  # rete, formato non supportato, ecc.
                failed.append(poster_id)
                print(f"  ! {poster_id}: {e}")

        # Ripiego: le serie che non si sono scaricate da Wikipedia si prendono da TVmaze
        retry = [t for t in titles if t["id"] in failed and t["type"] == "serie"
                 and "tvmaze" not in urls.get(t["id"], "")]
        for poster_id, url in tvmaze_posters(retry, titles).items():
            try:
                save_local(poster_id, url, tmp)
                sources[poster_id] = url
                downloaded += 1
                failed.remove(poster_id)
                print(f"  ✓ {poster_id}: presa da TVmaze")
            except Exception as e:
                print(f"  ! {poster_id} (TVmaze): {e}")

    # Rimuove le locandine di titoli che non esistono più
    ids = {t["id"] for t in titles}
    for f in POSTER_DIR.glob("*.jpg"):
        if f.stem not in ids:
            f.unlink()
            sources.pop(f.stem, None)
    SOURCES_FILE.write_text(json.dumps(sources, indent=2, ensure_ascii=False, sort_keys=True))

    posters = {t["id"]: f"assets/posters/{t['id']}.jpg"
               for t in titles if (POSTER_DIR / f"{t['id']}.jpg").exists()}
    out = ("// File generato da scripts/fetch_posters.py — non modificarlo a mano.\n"
           "// Le immagini sono in assets/posters/ (da dove vengono: assets/posters/sources.json).\n"
           "const POSTERS = " + json.dumps(posters, indent=2, ensure_ascii=False) + ";\n")
    (ROOT / "posters.js").write_text(out, encoding="utf-8")

    size = sum(f.stat().st_size for f in POSTER_DIR.glob("*.jpg"))
    print(f"posters.js aggiornato: {len(posters)} locandine in assets/posters/ "
          f"({downloaded} scaricate ora, {len(from_tvmaze)} da TVmaze, "
          f"{size / 1024 / 1024:.1f} MB in tutto).")
    for t in titles:
        if t["id"] not in posters:
            print(f"  ✗ manca: {t['title']}")


if __name__ == "__main__":
    main()
