(function () {
  const STORAGE_KEY = "marvel-timeline-visti";
  const timeline = document.getElementById("timeline");
  const posters = typeof POSTERS !== "undefined" ? POSTERS : {};

  const state = {
    type: "all",    // all | film | serie | speciale
    status: "all",  // all | todo | seen
    seen: loadSeen(),
  };

  // ---------- Salvataggio dei titoli visti (nel browser) ----------
  function loadSeen() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch (e) {
      return new Set();
    }
  }
  function saveSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.seen]));
    } catch (e) { /* storage non disponibile: la spunta vale solo per questa visita */ }
  }

  // ---------- Formattazione ----------
  function formatDuration(item) {
    if (item.type === "serie") {
      return item.episodes ? `${item.episodes} episodi` : "Episodi n.d.";
    }
    if (!item.minutes) return "Durata n.d.";
    const h = Math.floor(item.minutes / 60);
    const m = item.minutes % 60;
    return h ? `${h}h ${m}min` : `${m} min`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- Render ----------
  function cardHtml(item) {
    const title = escapeHtml(item.title);
    const seen = state.seen.has(item.id);
    const poster = posters[item.id];
    const isLogo = poster && /logo/i.test(poster);
    const posterHtml = poster
      ? `<img src="${poster}" alt="Locandina di ${title}" loading="lazy">`
      : `<span>${title}</span>`;
    return `
      <article class="card${seen ? " seen" : ""}">
        <div class="poster${isLogo ? " logo" : ""}">
          ${posterHtml}
          <span class="seen-mark" aria-hidden="true">✓</span>
        </div>
        <div class="info">
          <h3>${title}</h3>
          <div class="meta">
            <span class="badge ${item.type}">${item.type}</span>
            <span>${item.year}</span>
            <span>·</span>
            <span>${formatDuration(item)}</span>
          </div>
          <button type="button" class="seen-toggle" data-id="${item.id}" aria-pressed="${seen}">
            ${seen ? "✓ Visto" : "Segna visto"}
          </button>
        </div>
      </article>`;
  }

  function matches(item) {
    if (state.type !== "all" && item.type !== state.type) return false;
    const seen = state.seen.has(item.id);
    if (state.status === "seen" && !seen) return false;
    if (state.status === "todo" && seen) return false;
    return true;
  }

  function renderProgress() {
    const total = TITLES.length;
    const seen = TITLES.filter((t) => state.seen.has(t.id)).length;
    document.getElementById("progress-text").textContent = `${seen} / ${total} visti`;
    document.getElementById("progress-fill").style.width = `${(seen / total) * 100}%`;
  }

  function render() {
    const list = TITLES.filter(matches);
    timeline.innerHTML = list.length
      ? `<div class="grid">${list.map(cardHtml).join("")}</div>`
      : `<p class="empty">Nessun titolo da mostrare.</p>`;

    renderProgress();
  }

  // ---------- Eventi ----------
  timeline.addEventListener("click", (e) => {
    const btn = e.target.closest(".seen-toggle");
    if (!btn) return;
    const id = btn.dataset.id;
    if (state.seen.has(id)) state.seen.delete(id);
    else state.seen.add(id);
    saveSeen();
    render();
  });

  document.querySelectorAll(".filters").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state[group.dataset.group] = btn.dataset.filter;
      render();
    });
  });

  render();
})();
