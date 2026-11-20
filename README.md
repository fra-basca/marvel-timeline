# Marvel Timeline

Sito statico (HTML/CSS/JS, nessuna dipendenza) con la timeline dei film e delle serie del Marvel Cinematic Universe.

## Struttura

| File | Cosa contiene |
|---|---|
| `index.html` | Pagina |
| `style.css` | Stile (sfondo nero, layout responsive) |
| `app.js` | Genera la timeline e i filtri |
| `data.js` | **Elenco dei titoli** e delle fasi: è il file da modificare per aggiungere/correggere titoli |
| `characters.js` | Personaggi e titoli in cui compaiono (menu "Personaggio") |
| `assets/marvel-logo.svg` | Logo nell'intestazione |
| `REQUISITI.md` | Requisiti del progetto e prossimi passi |
| `posters.js` | Percorsi delle locandine, generato da `scripts/fetch_posters.py` |
| `episodes.js` | Episodi di ogni stagione (titolo, durata, data), generato da `scripts/fetch_episodes.py` |
| `scripts/fetch_posters.py` | Scarica le locandine in `assets/posters/` |
| `scripts/fetch_episodes.py` | Scarica da TVmaze gli episodi delle serie |
| `scripts/prepare_upload.py` | Prepara i file da caricare su GitHub, divisi in parti |
| `assets/posters/` | Locandine (e `sources.json` con la loro provenienza) |

## Vederlo in locale

Doppio clic su `index.html`, oppure:

```sh
python3 -m http.server 8000   # poi apri http://localhost:8000
```

## Locandine

Le locandine sono salvate in `assets/posters/` (una per titolo, ridotte a max 400×600 px). Vengono da Wikipedia (film) e da TVmaze (serie per cui Wikipedia ha solo il logo). Per aggiornarle, dopo aver aggiunto o modificato titoli:

```sh
python3 scripts/fetch_posters.py           # scarica solo le nuove o cambiate
python3 scripts/fetch_posters.py --force   # riscarica tutto
```

Se un film resta senza immagine, correggi il campo `wiki` in `data.js` con il nome esatto della pagina su en.wikipedia.org e rilancia lo script.

## Pubblicare su GitHub

GitHub dal browser accetta al massimo 100 file per volta, quindi:

```sh
python3 scripts/prepare_upload.py
```

crea la cartella `marvel-timeline-upload` (accanto a quella del progetto) divisa in `parte-1`, `parte-2`, … Per ogni parte, in ordine: apri https://github.com/fra-basca/marvel-timeline/upload/main, trascina il contenuto della parte, clicca **Commit changes**.

## Checklist "visto"

I titoli segnati come visti sono salvati nel browser (localStorage): restano dopo aver chiuso la pagina, ma valgono solo per quel browser e quel dispositivo.

## Aggiungere un titolo

Aggiungi una riga in `data.js` nella posizione giusta (l'ordine dell'array è l'ordine della timeline), poi rilancia lo script delle locandine.
