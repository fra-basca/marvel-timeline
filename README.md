# Marvel Timeline

Sito statico (HTML/CSS/JS, nessuna dipendenza) con la timeline dei film e delle serie del Marvel Cinematic Universe.

## Struttura

| File | Cosa contiene |
|---|---|
| `index.html` | Pagina |
| `style.css` | Stile (sfondo nero, layout responsive) |
| `app.js` | Genera la timeline e i filtri |
| `data.js` | **Elenco dei titoli**: è il file da modificare per aggiungere/correggere titoli |
| `posters.js` | URL delle locandine, generato dallo script |
| `scripts/fetch_posters.py` | Recupera le locandine da TMDB |

## Vederlo in locale

Doppio clic su `index.html`, oppure:

```sh
python3 -m http.server 8000   # poi apri http://localhost:8000
```

## Locandine

1. Crea un account gratuito su https://www.themoviedb.org e copia l'**API Read Access Token** da Impostazioni → API.
2. Lancia:
   ```sh
   export TMDB_TOKEN="..."
   python3 scripts/fetch_posters.py
   ```
3. Se un titolo non viene trovato, aggiungi/correggi il campo `original` (titolo inglese) in `data.js` e rilancia.

## Aggiungere un titolo

Aggiungi una riga in `data.js` nella posizione giusta (l'ordine dell'array è l'ordine della timeline), poi rilancia lo script delle locandine.
