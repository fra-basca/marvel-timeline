# Marvel Timeline – Requisiti

Ultimo aggiornamento: 20 novembre 2026

Sito personale con l'elenco di tutti i film e le serie del Marvel Cinematic Universe, con la possibilità di tenere traccia di ciò che si è visto.

Legenda stato: ✅ fatto · 🔜 da fare

---

## 1. Contenuti

| # | Requisito | Stato |
|---|---|---|
| 1.1 | Elenco di tutti i film, le serie e gli speciali del Marvel Cinematic Universe: produzioni Marvel Studios, serie Marvel Television (ABC, Netflix, Hulu, 2013–2020) e X-Men '97 | ✅ |
| 1.1a | Saga **X-Men della 20th Century Fox** ("X-Men Universe"): 13 film dal 2000 al 2020 (da X-Men a The New Mutants, compresi Deadpool e Logan) e le serie Legion e The Gifted | ✅ |
| 1.1b | **Sony's Spider-Man Universe**: Venom (3 film), Morbius, Madame Web, Kraven: Il cacciatore | ✅ |
| 1.2 | Ordine cronologico di uscita su tutta la pagina, in base alla data esatta di uscita di ogni titolo (campo `date` in `data.js`) | ✅ |
| 1.3 | Le serie con più stagioni hanno una scheda per ogni stagione | ✅ |
| 1.4 | Per ogni titolo: locandina, titolo, anno di uscita, durata | ✅ |
| 1.5 | Durata: in ore e minuti per film e speciali, numero di episodi per le serie | ✅ |
| 1.6 | Titoli in italiano quando esiste un titolo italiano ufficiale | ✅ |
| 1.7 | Locandine verticali per tutti i titoli: da Wikipedia (inglese) per i film; da TVmaze per le serie per cui Wikipedia ha solo il logo (con la locandina della stagione giusta, quando c'è) | ✅ |
| 1.7a | Le locandine sono **salvate nel progetto** (`assets/posters/`), ridotte a max 400×600 px e compresse: il sito non dipende da siti esterni ed è più leggero | ✅ |
| 1.8 | Se manca la locandina, al suo posto compare il titolo | ✅ |
| 1.9 | Elenco verificato su Wikipedia il 20/11/2026 (121 titoli) | ✅ |

| 1.10 | Elenco degli episodi di ogni stagione (numero, titolo, durata, data) da TVmaze, in `episodes.js` (generato da `scripts/fetch_episodes.py`); il numero di episodi in `data.js` coincide con TVmaze per tutte le 60 stagioni | ✅ |

**Dati completati il 20/11/2026:** durata di Avengers: Doomsday (150 min, da Wikipedia), locandina di Wonder Man (da TVmaze), episodi di X-Men '97 stagione 2 (9, confermati da TVmaze).

## 2. Fasi

| # | Requisito | Stato |
|---|---|---|
| 2.1 | I titoli sono divisi in sezioni per fase: Fase 1, 2, 3, 4, 5, 6 (fasi ufficiali Marvel Studios, come indicate da Wikipedia) | ✅ |
| 2.2 | Le fasi sono usate come **periodi**, per non perdere l'ordine cronologico: i titoli senza fase (serie Marvel Television, X-Men '97) vanno nella fase in corso quando sono usciti. Quelli usciti tra la fine di una fase e l'inizio della successiva restano nella fase precedente (per esempio Helstrom, 2020, è in Fase 3) | ✅ |
| 2.3 | I titoli inseriti in una fase a cui non appartengono hanno un'etichetta sulla locandina: "Marvel TV" o "Fuori fase" | ✅ |
| 2.3a | **X-Men Universe** e **Spider-Man Universe** hanno ciascuno una sezione propria, dopo la Fase 6, con i titoli in ordine di uscita | ✅ |
| 2.3b | ~~Sezione "Prima dell'MCU" e X-Men/Spider-Man Universe inseriti nelle fasi~~ — sostituito dalle sezioni separate | — |
| 2.4 | Ogni sezione mostra nome, anni coperti (calcolati in automatico dai titoli che contiene) e quanti titoli sono stati visti (per esempio "3/6 visti"); l'intestazione resta visibile in alto mentre si scorre | ✅ |
| 2.5 | ~~Sezioni separate "Marvel Television" e "Fuori dalle fasi"~~ — scartato perché rompeva l'ordine cronologico | — |

## 3. Aspetto

| # | Requisito | Stato |
|---|---|---|
| 3.1 | Sfondo nero | ✅ |
| 3.2 | Intestazione con il logo Marvel seguito dalla scritta "Timeline" | ✅ |
| 3.3 | Layout compatto: dentro ogni fase, schede una accanto all'altra (nessuna timeline verticale) | ✅ |
| 3.4 | Tutte le schede hanno la stessa dimensione (titolo fisso su 2 righe, troncato con "…" se più lungo; il titolo completo compare passandoci sopra con il mouse) | ✅ |
| 3.5 | Colore diverso dell'etichetta per film (rosso), serie (blu) e speciali (viola) | ✅ |
| 3.5a | Per le serie l'etichetta dice "Stagione N" invece di "serie" (le miniserie sono "Stagione 1"); nel titolo della scheda non si ripete "– Stagione N" | ✅ |
| 3.5b | Sotto l'etichetta, su un'unica riga: anno • durata (o numero di episodi), separati da un pallino dello stesso grigio del testo | ✅ |
| 3.6 | Responsive: su computer circa 8–9 schede per riga, su telefono 3 | ✅ |
| 3.6a | Nessun effetto al passaggio del mouse sulle schede (niente sollevamento) | ✅ |
| 3.7 | Nel piè di pagina: "Progetto personale non ufficiale, non affiliato a Marvel o Disney" | ✅ |

## 4. Filtri

| # | Requisito | Stato |
|---|---|---|
| 4.1 | ~~Filtro per tipo: Tutti / Film / Serie / Speciali~~ — rimosso su richiesta | — |
| 4.2 | ~~Menu a tendina **Sezione**~~ — rimosso per il momento (si può ripristinare) | — |
| 4.3 | ~~Menu a tendina **Personaggio**~~ — rimosso per il momento; i dati restano pronti in `characters.js` (non più caricato dalla pagina). Funzionamento previsto: mostra solo i titoli in cui il personaggio ha un ruolo importante (non i semplici cameo); 42 personaggi (aggiunti Venom, Professor X e Magneto; Wolverine, Deadpool e X-Men includono anche i film Fox), elenco in `characters.js` | ✅ |
| 4.4 | Oggi la pagina non ha filtri: mostra sempre tutti i titoli | ✅ |
| 4.5 | ~~Filtro Tutti / Da vedere / Visti~~ — rimosso su richiesta | — |

**Da verificare:** l'abbinamento personaggi ↔ titoli è stato compilato a mano. Per Avengers: Doomsday vale il cast annunciato.

## 5. Checklist "visto"

| # | Requisito | Stato |
|---|---|---|
| 5.1 | Film e speciali: pulsante "Segna visto" per spuntarli e togliere la spunta | ✅ |
| 5.2 | Serie: si spuntano i singoli **episodi**, da una finestra che si apre con il pulsante "Segna episodi" | ✅ |
| 5.3 | Finestra episodi: intestazione con miniatura della locandina, tag "Stagione N", titolo, anno • numero episodi e ✕ per chiudere | ✅ |
| 5.3a | Finestra episodi: riquadro di avanzamento con "x di N episodi visti", percentuale, barra e "Prossimo da vedere: episodio N" (o "Stagione completata ✓") | ✅ |
| 5.3b | Finestra episodi: griglia di episodi grandi e facili da toccare; quelli visti sono verdi con ✓, il prossimo da vedere ha il bordo rosso; le stagioni lunghe scorrono dentro la finestra | ✅ |
| 5.3c | Finestra episodi: pulsanti "Azzera", "Segna tutti" e "Fatto"; si chiude anche con ✕, cliccando fuori o con il tasto Esc | ✅ |
| 5.3d | Su telefono la finestra episodi si apre dal basso, a tutta larghezza | ✅ |
| 5.4 | Una serie risulta vista quando sono stati visti tutti i suoi episodi | ✅ |
| 5.5 | Ogni serie mostra **dentro la card**, sopra il pulsante, una barra di avanzamento con gli episodi visti (per esempio "3/9"); le card dei film hanno lo stesso spazio vuoto, così tutte le card restano alte uguali | ✅ |
| 5.6 | I titoli visti hanno una ✓ verde sulla locandina, che si scurisce leggermente | ✅ |
| 5.7 | Barra di avanzamento generale in alto, **larga quanto la griglia** e ben visibile: etichetta "Il tuo avanzamento", numero grande dei titoli visti ("12 di 121 titoli visti"), percentuale in un badge verde, barra spessa con sfumatura verde | ✅ |
| 5.8 | Oggi i dati sono salvati **nel browser**: restano dopo la chiusura della pagina, ma valgono solo per quel browser e quel dispositivo | ✅ |
| 5.8a | **Tempo di visione** sotto la barra generale: tempo guardato, tempo che manca e tempo totale (oggi circa 667 ore: 125 h di film e speciali, 542 h di serie). Per le serie conta la durata reale di ogni episodio visto | ✅ |
| 5.8b | Riquadro **"Prossimo da guardare"** sotto l'avanzamento: il primo titolo già uscito e non ancora visto, nell'ordine della pagina (Fasi 1–6, poi X-Men Universe, poi Spider-Man Universe). Per le serie indica il prossimo episodio con titolo e durata. Pulsanti: "Segna come visto" (film) oppure "Segna episodio N visto" e "Tutti gli episodi" (serie). Se hai visto tutto, mostra la prossima uscita | ✅ |
| 5.8c | Nella finestra episodi, passando il mouse su un episodio compaiono titolo e durata | ✅ |
| 5.9 | Salvataggio **online** con Firebase, per avere gli stessi dati su tutti i dispositivi e tra più persone (vedi sezione 7) | 🔜 |

## 6. Pubblicazione

| # | Requisito | Stato |
|---|---|---|
| 6.1 | Sito statico (HTML, CSS, JavaScript), senza installazioni né passaggi di compilazione | ✅ |
| 6.2 | Pubblicato gratis su GitHub Pages: https://fra-basca.github.io/marvel-timeline/ | ✅ |
| 6.3 | Aggiornamento dal browser, senza usare il Terminale: https://github.com/fra-basca/marvel-timeline/upload/main → trascinare i file → Commit changes | ✅ |
| 6.4 | GitHub accetta max 100 file per caricamento: `python3 scripts/prepare_upload.py` prepara la cartella `marvel-timeline-upload` (accanto al progetto) divisa in `parte-1`, `parte-2`, … da caricare una alla volta, in ordine | ✅ |

Dopo un aggiornamento, il browser può mostrare la versione vecchia per circa 10 minuti. Per vedere subito quella nuova: ⌘⇧R (Chrome) o ⌘⌥R (Safari).

## 7. Prossimi passi

- **Salvataggio online con Firebase** (database gratuito di Google):
  - Accesso con account Google. Solo gli account autorizzati possono spuntare; gli altri vedono il sito in sola lettura.
  - Aggiornamento in tempo reale tra dispositivi.
  - Al primo accesso, le spunte già salvate nel browser vengono trasferite online.
  - Da decidere: quali account possono modificare la lista.
- Possibile: pulsante per passare dall'ordine di uscita all'ordine cronologico degli eventi nella storia.
- Possibile: titoli dei singoli episodi nella finestra episodi (oggi sono solo numerati).
- Da aggiungere quando escono: Avengers: Secret Wars (17/12/2027), Your Friendly Neighborhood Spider-Man stagione 2 (13/01/2027), Daredevil: Rinascita stagione 3 (2027).
