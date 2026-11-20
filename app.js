(function () {
  const STORAGE_KEY = "marvel-timeline-progress";
  const OLD_STORAGE_KEY = "marvel-timeline-visti"; // versione precedente (solo film/serie interi)

  const timeline = document.getElementById("timeline");
  const dialog = document.getElementById("episodes-dialog");
  const posters = typeof POSTERS !== "undefined" ? POSTERS : {};
  const byId = new Map(TITLES.map((t) => [t.id, t]));
  const phaseTags = typeof PHASE_TAGS !== "undefined" ? PHASE_TAGS : {};

  // Tutti i titoli in ordine di uscita
  const ALL = [...TITLES].sort((a, b) => a.date.localeCompare(b.date));

  // Data di inizio di ogni fase MCU numerata (= uscita del suo primo titolo)
  const phaseStart = PHASES
    .filter((p) => typeof p.id === "number")
    .map((p) => ({ id: p.id, start: ALL.find((t) => t.phase === p.id).date }));

  const sectionIds = new Set(PHASES.map((p) => p.id));

  // Sezione in cui mostrare un titolo:
  // - se la sua "phase" è una sezione (Fase 1–6, X-Men Universe, Spider-Man Universe) va lì;
  // - altrimenti (Marvel TV, X-Men '97) va nella fase MCU in corso quando è uscito.
  function sectionOf(item) {
    if (sectionIds.has(item.phase)) return item.phase;
    let current = phaseStart[0].id;
    phaseStart.forEach((p) => { if (p.start <= item.date) current = p.id; });
    return current;
  }

  function yearOf(item) {
    return item.date.slice(0, 4);
  }

  // Anni coperti da ogni sezione, per esempio "2016–2020"
  const sectionYears = {};
  PHASES.forEach((p) => {
    const years = ALL.filter((t) => sectionOf(t) === p.id).map(yearOf);
    if (!years.length) return;
    const first = years[0], last = years[years.length - 1];
    sectionYears[p.id] = first === last ? first : `${first}–${last}`;
  });

  // Titoli nell'ordine in cui compaiono nella pagina (sezione per sezione, poi per data)
  const PAGE_ORDER = PHASES.flatMap((p) => ALL.filter((t) => sectionOf(t) === p.id));

  const episodesData = typeof EPISODES !== "undefined" ? EPISODES : {};
  const TODAY = new Date().toISOString().slice(0, 10);

  const state = {
    progress: loadProgress(), // { seen: Set(id film/speciali), episodes: { idSerie: Set(numeri episodio) } }
    openSeries: null,         // id della serie aperta nella finestra episodi
  };

  // ---------- Salvataggio ----------
  // Senza accesso i progressi stanno nel browser (localStorage).
  // Con l'accesso Google, firebase-sync.js imposta "cloudSaver" e i progressi vanno online.
  let cloudSaver = null;

  // Formato salvato: { seen: [id...], skipped: [id...], episodes: { idSerie: [numeri...] } }
  function serialize(progress) {
    const episodes = {};
    Object.entries(progress.episodes).forEach(([id, set]) => {
      if (set.size) episodes[id] = [...set].sort((a, b) => a - b);
    });
    return { seen: [...progress.seen].sort(), skipped: [...progress.skipped].sort(), episodes };
  }

  function deserialize(raw) {
    const episodes = {};
    Object.entries((raw && raw.episodes) || {}).forEach(([id, list]) => { episodes[id] = new Set(list); });
    return {
      seen: new Set((raw && raw.seen) || []),
      skipped: new Set((raw && raw.skipped) || []),
      episodes,
    };
  }

  function loadProgress() {
    const empty = { seen: new Set(), skipped: new Set(), episodes: {} };
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (raw) return deserialize(raw);
      // Migrazione dalla versione precedente: una serie "vista" = tutti gli episodi visti
      const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
      if (Array.isArray(old)) {
        old.forEach((id) => {
          const t = byId.get(id);
          if (!t) return;
          if (t.type === "serie") empty.episodes[id] = new Set(range(t.episodes));
          else empty.seen.add(id);
        });
      }
    } catch (e) { /* dati assenti o illeggibili: si parte da zero */ }
    return empty;
  }

  function saveProgress() {
    const data = serialize(state.progress);
    if (cloudSaver) {
      cloudSaver(data);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage non disponibile: i dati valgono solo per questa visita */ }
  }

  // Mostra dei progressi arrivati da fuori (es. dal database online) e aggiorna la pagina
  function showProgress(progress) {
    state.progress = progress;
    render();
    if (dialog.open && state.openSeries) updateDialog();
  }

  // Collegamento con firebase-sync.js
  window.MarvelTimeline = {
    // progressi salvati in questo browser
    localProgress: () => serialize(loadProgress()),
    clearLocal: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* niente */ } },
    // da qui in poi salva online con questa funzione
    useCloud: (saver) => { cloudSaver = saver; },
    // torna al salvataggio nel browser
    useLocal: () => { cloudSaver = null; showProgress(loadProgress()); },
    // mostra i progressi arrivati dal database
    showRemote: (raw) => showProgress(deserialize(raw)),
  };

  // ---------- Utilità ----------
  function range(n) {
    return Array.from({ length: n || 0 }, (_, i) => i + 1);
  }

  function episodesSeen(id) {
    return state.progress.episodes[id] || new Set();
  }

  function isSeen(item) {
    if (item.type === "serie") return item.episodes > 0 && episodesSeen(item.id).size >= item.episodes;
    return state.progress.seen.has(item.id);
  }

  // Titolo saltato (non disponibile sulle vostre piattaforme): non conta nei totali
  function isSkipped(item) {
    return state.progress.skipped.has(item.id);
  }

  function setSkipped(id, skipped) {
    if (skipped) state.progress.skipped.add(id); else state.progress.skipped.delete(id);
    saveProgress();
    render();
  }

  function formatDuration(item) {
    if (item.type === "serie") {
      return item.episodes ? `${item.episodes} episodi` : "Episodi n.d.";
    }
    if (!item.minutes) return "Durata n.d.";
    const h = Math.floor(item.minutes / 60);
    const m = item.minutes % 60;
    return h ? `${h}h ${m}min` : `${m} min`;
  }

  // Numero di stagione: dal campo "season", oppure da "– Stagione N" nel titolo; le miniserie sono stagione 1
  const SEASON_SUFFIX = /\s+–\s+Stagione\s+(\d+)$/;
  function seasonNumber(item) {
    if (item.season) return item.season;
    const m = item.title.match(SEASON_SUFFIX);
    return m ? Number(m[1]) : 1;
  }

  // Titolo nella card: senza "– Stagione N", che è già nel tag
  function cardTitle(item) {
    return item.type === "serie" ? item.title.replace(SEASON_SUFFIX, "") : item.title;
  }

  function badgeLabel(item) {
    return item.type === "serie" ? `Stagione ${seasonNumber(item)}` : item.type;
  }

  // ---------- Tempo di visione ----------
  // Episodio n di una serie (da episodes.js): { n, title, minutes, date }
  function episodeInfo(id, n) {
    return (episodesData[id] || []).find((e) => e.n === n) || null;
  }

  // Durata totale di un titolo in minuti (per le serie: somma degli episodi)
  function totalMinutes(item) {
    if (item.type !== "serie") return item.minutes || 0;
    return (episodesData[item.id] || []).reduce((sum, e) => sum + (e.minutes || 0), 0);
  }

  // Minuti già guardati di un titolo
  function watchedMinutes(item) {
    if (item.type !== "serie") return state.progress.seen.has(item.id) ? item.minutes || 0 : 0;
    let sum = 0;
    episodesSeen(item.id).forEach((n) => { sum += (episodeInfo(item.id, n) || {}).minutes || 0; });
    return sum;
  }

  // 3245 → "54 h 5 min"
  function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m} min`;
    return m ? `${h.toLocaleString("it-IT")} h ${m} min` : `${h.toLocaleString("it-IT")} h`;
  }

  function formatDate(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  }

  function sectionName(item) {
    return (PHASES.find((p) => p.id === sectionOf(item)) || {}).name || "";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- Card ----------
  function buttonHtml(item, seen) {
    if (isSkipped(item)) {
      return `<button type="button" class="seen-toggle restore" data-action="restore" data-id="${item.id}">↺ Ripristina</button>`;
    }
    if (item.type === "serie") {
      const label = seen ? "✓ Vista" : "Segna episodi";
      return `<button type="button" class="seen-toggle" data-action="episodes" data-id="${item.id}">${label}</button>`;
    }
    return `<button type="button" class="seen-toggle" data-action="toggle" data-id="${item.id}" aria-pressed="${seen}">
      ${seen ? "✓ Visto" : "Segna visto"}</button>`;
  }

  function cardHtml(item) {
    const title = escapeHtml(cardTitle(item));
    const seen = isSeen(item);
    const poster = posters[item.id];
    const isLogo = poster && /logo/i.test(poster);
    const posterHtml = poster
      ? `<img src="${poster}" alt="Locandina di ${title}" loading="lazy">`
      : `<span>${title}</span>`;

    let epRow = `<div class="ep-row" aria-hidden="true"></div>`;
    if (item.type === "serie") {
      const done = episodesSeen(item.id).size;
      epRow = `
        <div class="ep-row" title="${done} episodi visti su ${item.episodes}">
          <div class="ep-bar"><span style="width:${(done / item.episodes) * 100}%"></span></div>
          <span class="ep-text">${done}/${item.episodes}</span>
        </div>`;
    }

    const skipped = isSkipped(item);
    const skipControl = skipped
      ? `<span class="skip-label">Saltato</span>`
      : seen ? "" : `<button type="button" class="skip-btn" data-id="${item.id}" title="Salta (non disponibile)" aria-label="Salta ${title}">⊘</button>`;

    return `
      <article class="card${seen && !skipped ? " seen" : ""}${skipped ? " skipped" : ""}">
        <div class="poster${isLogo ? " logo" : ""}">
          ${posterHtml}
          ${phaseTags[item.phase] ? `<span class="origin-tag">${phaseTags[item.phase]}</span>` : ""}
          <span class="seen-mark" aria-hidden="true">✓</span>
          ${skipControl}
        </div>
        <div class="info">
          <h3 title="${title}">${title}</h3>
          <div class="meta">
            <span class="badge ${item.type}">${badgeLabel(item)}</span>
          </div>
          <div class="duration">${yearOf(item)}<span class="dot" aria-hidden="true">•</span>${formatDuration(item)}</div>
          ${epRow}
          ${buttonHtml(item, seen)}
        </div>
      </article>`;
  }

  // ---------- Render ----------

  function renderProgress() {
    // I titoli saltati non contano: si arriva al 100% di ciò che si può vedere
    const available = TITLES.filter((t) => !isSkipped(t));
    const skippedCount = TITLES.length - available.length;
    const total = available.length;
    const seen = available.filter(isSeen).length;
    const pct = total ? Math.round((seen / total) * 100) : 100;
    document.getElementById("progress-count").textContent = seen;
    document.getElementById("progress-total").textContent =
      `di ${total} titoli visti` + (skippedCount ? ` · ${skippedCount} saltati` : "");
    document.getElementById("progress-pct").textContent = `${pct}%`;
    document.getElementById("progress-fill").style.width = `${total ? (seen / total) * 100 : 100}%`;
    document.getElementById("progress-bar").setAttribute("aria-valuenow", pct);

    // Tempo di visione
    const totalTime = available.reduce((sum, t) => sum + totalMinutes(t), 0);
    const watchedTime = available.reduce((sum, t) => sum + watchedMinutes(t), 0);
    document.getElementById("time-watched").textContent = formatTime(watchedTime);
    document.getElementById("time-left").textContent = formatTime(totalTime - watchedTime);
    document.getElementById("time-total").textContent = formatTime(totalTime);
  }

  // ---------- Prossimo da guardare ----------
  // Primo titolo già uscito e non ancora visto, nell'ordine della pagina.
  // Per una serie iniziata indica il primo episodio non visto.
  function findNext() {
    const item = PAGE_ORDER.find((t) => t.date <= TODAY && !isSeen(t) && !isSkipped(t));
    if (!item) return null;
    if (item.type !== "serie") return { item };
    const seenSet = episodesSeen(item.id);
    const n = range(item.episodes).find((x) => !seenSet.has(x));
    return { item, episode: n, info: episodeInfo(item.id, n) };
  }

  function renderNext() {
    const box = document.getElementById("next-up");
    const next = findNext();

    if (!next) {
      const upcoming = PAGE_ORDER.filter((t) => t.date > TODAY && !isSkipped(t))
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      box.innerHTML = `
        <div class="next-done">
          <strong>Hai visto tutto quello che è uscito finora!</strong>
          ${upcoming ? `<span>Prossima uscita: ${escapeHtml(upcoming.title)}, ${formatDate(upcoming.date)}</span>` : ""}
        </div>`;
      return;
    }

    const { item, episode, info } = next;
    const title = escapeHtml(cardTitle(item));
    const poster = posters[item.id];
    let detail, actions;

    if (item.type === "serie") {
      const epTitle = info && info.title ? ` · “${escapeHtml(info.title)}”` : "";
      const epTime = info && info.minutes ? ` · ${info.minutes} min` : "";
      const done = episodesSeen(item.id).size;
      detail = `Episodio ${episode} di ${item.episodes}${epTitle}${epTime}`;
      if (done) detail += ` <span class="next-sub">(${done} già visti)</span>`;
      actions = `
        <button type="button" class="next-primary" data-action="mark-episode" data-id="${item.id}" data-episode="${episode}">✓ Segna episodio ${episode} visto</button>
        <button type="button" class="next-secondary" data-action="episodes" data-id="${item.id}">Tutti gli episodi</button>`;
    } else {
      detail = `${yearOf(item)} • ${formatDuration(item)}`;
      actions = `<button type="button" class="next-primary" data-action="mark-title" data-id="${item.id}">✓ Segna come visto</button>`;
    }
    const skipWhat = item.type === "serie" ? "stagione" : "titolo";
    actions += `<button type="button" class="next-skip" data-action="skip" data-id="${item.id}" title="Non disponibile sulle vostre piattaforme: salta questa ${skipWhat}">⊘ Salta</button>`;

    box.innerHTML = `
      <div class="next-poster">${poster ? `<img src="${poster}" alt="">` : ""}</div>
      <div class="next-body">
        <span class="next-label">Prossimo da guardare</span>
        <h2 class="next-title">${title}</h2>
        <div class="next-meta">
          <span class="badge ${item.type}">${badgeLabel(item)}</span>
          <span>${sectionName(item)}</span>
        </div>
        <p class="next-detail">${detail}</p>
        <div class="next-actions">${actions}</div>
      </div>`;
  }

  document.getElementById("next-up").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "episodes") openEpisodes(id);
    if (btn.dataset.action === "skip") setSkipped(id, true);
    if (btn.dataset.action === "mark-title") {
      state.progress.seen.add(id);
      saveProgress();
      render();
    }
    if (btn.dataset.action === "mark-episode") {
      const set = new Set(episodesSeen(id));
      set.add(Number(btn.dataset.episode));
      state.progress.episodes[id] = set;
      saveProgress();
      render();
    }
  });

  function render() {
    const list = ALL;
    const sections = PHASES.map((phase) => {
      const items = list.filter((t) => sectionOf(t) === phase.id);
      if (!items.length) return "";
      const counted = items.filter((t) => !isSkipped(t)); // i saltati non contano
      const seen = counted.filter(isSeen).length;
      return `
        <section class="phase">
          <header class="phase-header">
            <h2>${phase.name}</h2>
            <span class="phase-years">${sectionYears[phase.id]}</span>
            <span class="phase-count">${seen}/${counted.length} visti</span>
          </header>
          <div class="grid">${items.map(cardHtml).join("")}</div>
        </section>`;
    }).join("");

    timeline.innerHTML = sections || `<p class="empty">Nessun titolo da mostrare.</p>`;
    renderProgress();
    renderNext();
  }

  // ---------- Finestra episodi ----------
  const epList = dialog.querySelector(".episodes-list");

  // Costruisce la finestra quando si apre
  function buildDialog() {
    const item = byId.get(state.openSeries);
    const poster = posters[item.id];
    const posterBox = dialog.querySelector(".ed-poster");
    posterBox.classList.toggle("logo", !!poster && /logo/i.test(poster));
    posterBox.innerHTML = poster ? `<img src="${poster}" alt="">` : "";
    dialog.querySelector(".ed-badge").textContent = `Stagione ${seasonNumber(item)}`;
    dialog.querySelector("h2").textContent = cardTitle(item);
    dialog.querySelector(".ed-meta").textContent = `${yearOf(item)} • ${item.episodes} episodi`;

    const seenSet = episodesSeen(item.id);
    epList.innerHTML = range(item.episodes).map((n) => `
      <label class="ep-chip" title="${escapeHtml(episodeTooltip(item.id, n))}">
        <input type="checkbox" value="${n}" ${seenSet.has(n) ? "checked" : ""}>
        <span class="ep-num">${n}</span>
        <span class="ep-check" aria-hidden="true">✓</span>
      </label>`).join("");
    updateDialog();
  }

  // Testo che compare passando il mouse su un episodio: "Episodio 1 – Glorious Purpose (52 min)"
  function episodeTooltip(id, n) {
    const info = episodeInfo(id, n);
    if (!info) return `Episodio ${n}`;
    return `Episodio ${n} – ${info.title}${info.minutes ? ` (${info.minutes} min)` : ""}`;
  }

  // Aggiorna avanzamento ed evidenziazione senza ricostruire la finestra
  function updateDialog() {
    const item = byId.get(state.openSeries);
    const seenSet = episodesSeen(item.id);
    const done = seenSet.size;
    const pct = Math.round((done / item.episodes) * 100);
    const next = range(item.episodes).find((n) => !seenSet.has(n));

    dialog.querySelector(".episodes-count").textContent = `${done} di ${item.episodes} episodi visti`;
    dialog.querySelector(".ed-percent").textContent = `${pct}%`;
    dialog.querySelector(".ed-bar > span").style.width = `${pct}%`;
    dialog.querySelector(".ed-next").textContent = next
      ? `Prossimo da vedere: episodio ${next}`
      : "Stagione completata ✓";
    dialog.classList.toggle("complete", !next);

    epList.querySelectorAll("input").forEach((input) => {
      const n = Number(input.value);
      input.checked = seenSet.has(n);
      input.parentElement.classList.toggle("next", n === next);
    });
  }

  function openEpisodes(id) {
    state.openSeries = id;
    buildDialog();
    dialog.showModal();
  }

  function setEpisodes(id, numbers) {
    state.progress.episodes[id] = new Set(numbers);
    saveProgress();
    updateDialog();
    render();
  }

  epList.addEventListener("change", (e) => {
    const id = state.openSeries;
    const set = new Set(episodesSeen(id));
    const n = Number(e.target.value);
    if (e.target.checked) set.add(n); else set.delete(n);
    setEpisodes(id, set);
  });

  dialog.addEventListener("click", (e) => {
    // Clic sullo sfondo scuro = chiudi
    if (e.target === dialog) { dialog.close(); return; }
    const action = e.target.closest("[data-action]")?.dataset.action;
    const item = byId.get(state.openSeries);
    if (action === "all") setEpisodes(item.id, range(item.episodes));
    if (action === "none") setEpisodes(item.id, []);
    if (action === "close") dialog.close();
  });

  // ---------- Eventi card ----------
  timeline.addEventListener("click", (e) => {
    const skipBtn = e.target.closest(".skip-btn");
    if (skipBtn) {
      setSkipped(skipBtn.dataset.id, true);
      return;
    }
    const btn = e.target.closest(".seen-toggle");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "restore") {
      setSkipped(id, false);
      return;
    }
    if (btn.dataset.action === "episodes") {
      openEpisodes(id);
      return;
    }
    const seen = state.progress.seen;
    if (seen.has(id)) seen.delete(id); else seen.add(id);
    saveProgress();
    render();
  });


  render();
})();
