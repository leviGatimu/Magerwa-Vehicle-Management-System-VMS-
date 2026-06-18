/* Magerwa — public vehicle detail */
(function () {
  "use strict";

  function renderNav() {
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
        <div class="nav-links"><a href="/" class="active">Browse</a></div>
        <div class="nav-actions">${right}</div>
      </div></nav>`;
    const lo = document.getElementById("nav-logout");
    if (lo) lo.addEventListener("click", async () => {
      try { await Api.clientLogout(); } catch (_) {}
      Session.clear();
      location.href = "/";
    });
  }

  function badge(status) {
    const s = ["available", "reserved", "sold"].includes(status) ? status : "available";
    return `<span class="badge ${s}">${esc(status || "")}</span>`;
  }

  const id = qsParam("id");

  async function load() {
    const box = document.querySelector("[data-detail]");
    if (!id) {
      box.innerHTML = `<div class="empty">No vehicle selected. <a class="accent" href="/">Back to browse</a>.</div>`;
      return;
    }
    box.innerHTML = `<div class="spinner"></div>`;
    try {
      const res = await Api.publicVehicle(id);
      const v = res.data || res;
      if (!v || !v.id) throw { message: "Vehicle not found." };
      render(v);
    } catch (err) {
      box.innerHTML = `<div class="empty">${esc((err && err.message) || "Vehicle not found.")}
        <br><a class="accent" href="/">Back to browse</a>.</div>`;
    }
  }

  function render(v) {
    const box = document.querySelector("[data-detail]");
    const title = esc((v.manufacture_company || "") + " " + (v.model_name || ""));
    box.innerHTML = `
      <div class="detail-grid">
        <div class="detail-media">
          <img src="${esc(carImg(v))}" alt="${title}">
        </div>
        <div class="detail-info">
          <span class="pill">${esc(v.category || "—")}</span>
          <h1 style="margin:12px 0 4px">${title}</h1>
          <div class="muted">${esc(v.manufacturer || "")} • ${esc(String(v.manufacture_year || ""))}</div>
          <div style="display:flex;align-items:center;gap:14px;margin:14px 0 4px">
            <span class="price" style="font-size:1.9rem">${money(v.price)}</span>
            ${badge(v.status)}
          </div>
          <div class="spec-list">
            ${spec("Year", v.manufacture_year)}
            ${spec("Category", v.category)}
            ${spec("Manufacturer", v.manufacturer)}
            ${spec("Company", v.manufacture_company)}
            ${spec("Chassis", v.chassis_number, true)}
            ${spec("Plate", v.plate_number || "—", true)}
          </div>
          <div class="alert ok" data-ok></div>
          <div class="alert error" data-err></div>
          <div data-buy></div>
          <div class="owner-card muted">
            All Magerwa vehicles are cleared through the bonded warehouse. Submit a purchase
            request and our team will confirm availability and finalise paperwork.
          </div>
        </div>
      </div>`;
    renderBuy(v);
  }

  function spec(label, val, mono) {
    return `<div>
      <div class="s-l">${esc(label)}</div>
      <div class="s-v ${mono ? "cell-mono" : ""}">${esc(val === 0 || val ? String(val) : "—")}</div>
    </div>`;
  }

  function renderBuy(v) {
    const slot = document.querySelector("[data-buy]");
    if (!Session.isClient()) {
      slot.innerHTML = `<a class="btn btn-primary btn-lg"
        href="/login?redirect=${encodeURIComponent("/car?id=" + v.id)}">Login to buy</a>`;
      return;
    }
    if (v.status !== "available") {
      slot.innerHTML = `<button class="btn btn-outline btn-lg" disabled
        style="opacity:.5;cursor:not-allowed">Not available</button>`;
      return;
    }
    slot.innerHTML = `<button class="btn btn-primary btn-lg" id="buy-btn">Buy this car</button>`;
    document.getElementById("buy-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "Submitting…";
      const ok = document.querySelector("[data-ok]");
      const err = document.querySelector("[data-err]");
      ok.style.display = "none"; err.style.display = "none";
      try {
        await Api.buy(v.id);
        ok.textContent = "Purchase request submitted — pending admin approval.";
        ok.style.display = "block";
        slot.innerHTML = `<button class="btn btn-outline btn-lg" disabled
          style="opacity:.5;cursor:not-allowed">Request submitted</button>`;
        const bd = document.querySelector(".detail-grid .badge");
        if (bd) { bd.className = "badge reserved"; bd.textContent = "reserved"; }
      } catch (ex) {
        err.textContent = fieldError(ex);
        err.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Buy this car";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNav();
    load();
  });
})();
