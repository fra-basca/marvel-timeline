#!/usr/bin/env python3
"""Prepara i file da caricare su GitHub dal browser, divisi in parti.

GitHub accetta al massimo 100 file per ogni caricamento dal browser, e con le
locandine il progetto ne ha di più. Questo script copia il progetto nella
cartella "marvel-timeline-upload" (accanto a quella del progetto), divisa in
parte-1, parte-2, ... con al massimo 95 file ciascuna.

Uso (dalla cartella del progetto):
    python3 scripts/prepare_upload.py

Poi, per ogni parte, nell'ordine:
  1. apri https://github.com/fra-basca/marvel-timeline/upload/main
  2. apri la cartella della parte nel Finder, premi ⌘A e trascina tutto nel browser
  3. clicca "Commit changes"
"""
import re
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / "marvel-timeline-upload"
MAX_FILES = 95  # margine sotto il limite di 100 di GitHub
SKIP_DIRS = {".git", "__pycache__", ".claude"}
SKIP_FILES = {".DS_Store"}


def project_files():
    files = []
    for f in sorted(ROOT.rglob("*")):
        rel = f.relative_to(ROOT)
        if f.is_dir() or rel.parts[0] in SKIP_DIRS or f.name in SKIP_FILES:
            continue
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if f.name.startswith("."):  # file nascosti (es. .gitignore): il Finder non li seleziona
            continue
        files.append(rel)
    # Prima il codice, poi le locandine: così la parte 1 contiene sempre il sito completo
    return sorted(files, key=lambda r: (r.parts[:2] == ("assets", "posters"), str(r)))


def main():
    files = project_files()
    if OUT.exists():
        shutil.rmtree(OUT)

    parts = [files[i:i + MAX_FILES] for i in range(0, len(files), MAX_FILES)]
    for n, part in enumerate(parts, start=1):
        dest = OUT / f"parte-{n}"
        for rel in part:
            target = dest / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / rel, target)
        print(f"parte-{n}: {len(part)} file")

    # Numero di versione nei link di index.html (style.css?v=..., app.js?v=...):
    # cambia a ogni pubblicazione, così il browser riscarica tutti i file insieme
    # invece di mescolare versioni vecchie (in cache) e nuove.
    version = time.strftime("%Y%m%d%H%M")
    for index in OUT.glob("parte-*/index.html"):
        html = index.read_text(encoding="utf-8")
        index.write_text(re.sub(r"\?v=[\w-]+", f"?v={version}", html), encoding="utf-8")
    print(f"versione: {version}")

    print(f"\nPronto in: {OUT}")
    print("Carica le parti una alla volta, in ordine, da "
          "https://github.com/fra-basca/marvel-timeline/upload/main")


if __name__ == "__main__":
    main()
