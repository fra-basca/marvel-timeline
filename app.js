(function () {
  const timeline = document.getElementById("timeline");
  const posters = typeof POSTERS !== "undefined" ? POSTERS : {};

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

  function cardHtml(item) {
    const title = escapeHtml(item.title);
    const poster = posters[item.id];
    const posterHtml = poster
      ? `<img src="${poster}" alt="Locandina di ${title}" loading="lazy">`
      : `<span>${title}</span>`;
    return `
      <article class="card">
        <div class="poster">${posterHtml}</div>
        <div class="info">
          <h3>${title}</h3>
          <div class="meta">
            <span class="badge ${item.type}">${item.type}</span>
            <span>${item.year}</span>
            <span>·</span>
            <span>${formatDuration(item)}</span>
          </div>
        </div>
      </article>`;
  }

  function render(filter) {
    const items = TITLES.filter((t) => filter === "all" || t.type === filter);
    const byYear = new Map();
    items.forEach((t) => {
      if (!byYear.has(t.year)) byYear.set(t.year, []);
      byYear.get(t.year).push(t);
    });

    timeline.innerHTML = [...byYear.entries()].map(([year, list]) => `
      <section class="year">
        <h2 class="year-label">${year}</h2>
        <div class="grid">${list.map(cardHtml).join("")}</div>
      </section>`).join("");
  }

  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render(btn.dataset.filter);
    });
  });

  render("all");
})();
