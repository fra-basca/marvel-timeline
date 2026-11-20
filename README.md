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
| `scripts/fetch_posters.py` | Recupera le locandine da Wikipedia |

## Vederlo in locale

Doppio clic su `index.html`, oppure:

```sh
python3 -m http.server 8000   # poi apri http://localhost:8000
```

## Locandine

Le locandine vengono da Wikipedia (inglese), senza bisogno di account. Per aggiornarle:

```sh
python3 scripts/fetch_posters.py
```

Se un titolo resta senza immagine, correggi il campo `wiki` in `data.js` con il nome esatto della pagina su en.wikipedia.org e rilancia lo script.

## Checklist "visto"

I titoli segnati come visti sono salvati nel browser (localStorage): restano dopo aver chiuso la pagina, ma valgono solo per quel browser e quel dispositivo.

## Aggiungere un titolo

Aggiungi una riga in `data.js` nella posizione giusta (l'ordine dell'array è l'ordine della timeline), poi rilancia lo script delle locandine.
