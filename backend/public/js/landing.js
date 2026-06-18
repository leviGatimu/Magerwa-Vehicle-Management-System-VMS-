/* Magerwa — landing (public browse) */
(function () {
  "use strict";

  // ---- shared nav (duplicated per page; can't extend api.js) ----
  function renderNav(active) {
    const el = document.querySelector("[data-nav]");
    if (!el) return;
    const right = Session.isClient()
      ? `<a href="/portal" class="btn btn-ghost">My Portal</a>
         <button class="btn btn-outline" id="nav-logout">Log out</button>`
      : `<a href="/admin" class="btn btn-ghost">Admin</a>
         <a href="/login" class="btn btn-primary">Login</a>`;
    el.innerHTML = `
      <nav class="nav"><div class="nav-inner">
        <a href="/" class="brand"><span class="dot">M</span> MAGERWA</a>
        <div class="nav-links">
          <a href="/" class="${active === "browse" ? "active" : ""}">Browse</a>
        </div>
        <div class="nav-actions">${right}</div>
      </div></nav>`;
    const lo = document.getElementById("nav-logout");
    if (lo) lo.addEventListener("click", async () => {
      try { await Api.clientLogout(); } catch (_) {}
      Session.clear();
      location.href = "/";
    });
  }

  const CATEGORIES = ["Economy", "Luxury", "SUV", "Sport", "Exotic"];

  function badge(status) {
    const s = ["available", "reserved", "sold"].includes(status) ? status : "available";
    return `<span class="badge ${s}">${esc(status || "")}</span>`;
  }

  const state = {
    search: qsParam("search") || "",
    category: qsParam("category") || "",
    page: parseInt(qsParam("page") || "1", 10) || 1,
  };

  function buildQs() {
    const p = new URLSearchParams();
    if (state.search) p.set("search", state.search);
    if (state.category) p.set("category", state.category);
    if (state.page > 1) p.set("page", state.page);
    const s = p.toString();
    return s ? "?" + s : "";
  }

  function syncUrl() {
    history.replaceState(null, "", location.pathname + buildQs());
  }

  // ---- stats ----
  async function loadStats() {
    const box = document.querySelector("[data-stats]");
    try {
      const s = await Api.publicStats();
      const cards = [
        { l: "Total cars", k: s.vehicles ?? s.total ?? 0, accent: false },
        { l: "Available", k: s.available ?? 0, accent: true },
        { l: "Sold", k: s.sold ?? 0, accent: false },
        { l: "Brands", k: s.brands ?? s.manufacturers ?? 0, accent: false },
      ];
      box.innerHTML = cards.map((c) =>
        `<div class="stat${c.accent ? " accent" : ""}">
           <div class="k">${esc(String(c.k))}</div>
           <div class="l">${esc(c.l)}</div>
         </div>`).join("");
    } catch (_) {
      box.innerHTML = "";
    }
  }

  // ---- categories ----
  function loadCats() {
    const box = document.querySelector("[data-cats]");
    box.innerHTML = CATEGORIES.map((c) =>
      `<div class="cat" data-cat="${esc(c)}">
         <div class="cat-icon">${carIcon()}</div>
         <h4>${esc(c)}</h4>
         <span class="muted" style="font-size:.82rem">Browse ${esc(c)} cars</span>
       </div>`).join("");
    box.querySelectorAll(".cat").forEach((card) => {
      card.addEventListener("click", () => {
        state.category = card.dataset.cat;
        state.page = 1;
        document.getElementById("category").value = state.category;
        syncUrl();
        loadCars();
        document.querySelector("[data-cars]").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function carIcon() {
    return `<svg viewBox="0 0 88 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 38h72M16 38c0-9 6-18 14-20l8-2h16c8 0 14 6 20 12l6 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <circle cx="26" cy="42" r="6" stroke="currentColor" stroke-width="3"/>
      <circle cx="64" cy="42" r="6" stroke="currentColor" stroke-width="3"/></svg>`;
  }

  // ---- car grid ----
  async function loadCars() {
    const wrap = document.querySelector("[data-cars]");
    const pager = document.querySelector("[data-pager]");
    wrap.innerHTML = `<div class="spinner"></div>`;
    pager.innerHTML = "";
    try {
      const res = await Api.publicVehicles(buildQs());
      const items = res.data || res || [];
      if (!items.length) {
        wrap.innerHTML = `<div class="empty">No cars match your search. Try another make, model or category.</div>`;
        return;
      }
      wrap.innerHTML = `<div class="grid-cars">` + items.map(cardHtml).join("") + `</div>`;
      renderPager(res, pager);
    } catch (err) {
      wrap.innerHTML = `<div class="empty">Couldn't load cars. ${esc((err && err.message) || "")}</div>`;
    }
  }

  function cardHtml(v) {
    return `
      <a class="car-card" href="/car?id=${encodeURIComponent(v.id)}">
        <div class="car-card__media"><img src="${esc(carImg(v))}" alt="${esc(v.model_name || "")}" loading="lazy"></div>
        <div class="car-card__body">
          <div class="car-card__title">${esc((v.manufacture_company || "") + " " + (v.model_name || ""))}</div>
          <div class="car-card__meta">${esc(v.manufacturer || "")} • ${esc(String(v.manufacture_year || ""))} • ${esc(v.category || "")}</div>
          <div class="car-card__foot">
            <span class="price">${money(v.price)}</span>
            ${badge(v.status)}
          </div>
        </div>
      </a>`;
  }

  function renderPager(res, pager) {
    const last = res.last_page || 1;
    const cur = res.current_page || state.page;
    if (last <= 1) return;
    const btn = (label, page, opts = {}) =>
      `<button ${opts.disabled ? "disabled" : ""} class="${opts.active ? "active" : ""}" data-page="${page}">${label}</button>`;
    let html = btn("‹", cur - 1, { disabled: cur <= 1 });
    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || Math.abs(i - cur) <= 2) {
        html += btn(String(i), i, { active: i === cur });
      } else if (i === cur - 3 || i === cur + 3) {
        html += `<span class="muted" style="padding:0 4px">…</span>`;
      }
    }
    html += btn("›", cur + 1, { disabled: cur >= last });
    pager.innerHTML = html;
    pager.querySelectorAll("button[data-page]").forEach((b) => {
      b.addEventListener("click", () => {
        const p = parseInt(b.dataset.page, 10);
        if (p < 1 || p > last) return;
        state.page = p;
        syncUrl();
        loadCars();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // ---- search form ----
  function initSearch() {
    document.getElementById("q").value = state.search;
    document.getElementById("category").value = state.category;
    document.getElementById("search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      state.search = document.getElementById("q").value.trim();
      state.category = document.getElementById("category").value;
      state.page = 1;
      syncUrl();
      loadCars();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNav("browse");
    initSearch();
    loadCats();
    loadStats();
    loadCars();
    initReveal();
  });
})();
