/* Magerwa — client portal */
(function () {
  "use strict";

  function renderNav() {
    const el = document.querySelector("[data-nav]");
    if (!el) return;
    el.innerHTML = `
      <nav class="nav"><div class="nav-inner">
        <a href="/" class="brand"><span class="dot">M</span> MAGERWA</a>
        <div class="nav-links">
          <a href="/">Browse</a>
          <a href="/portal" class="active">My Portal</a>
        </div>
        <div class="nav-actions">
          <button class="btn btn-outline" id="nav-logout">Log out</button>
        </div>
      </div></nav>`;
    document.getElementById("nav-logout").addEventListener("click", logout);
  }

  async function logout() {
    try { await Api.clientLogout(); } catch (_) {}
    Session.clear();
    location.href = "/";
  }

  // pending -> reserved style, approved -> available/green, rejected -> sold/red
  function orderBadge(status) {
    const s = status === "approved" ? "available" : status === "rejected" ? "sold" : "reserved";
    return `<span class="badge ${s}">${esc(status || "")}</span>`;
  }

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return esc(String(d));
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderHero() {
    const u = Session.user() || {};
    const el = document.querySelector("[data-hero]");
    el.innerHTML = `
      <div>
        <h1 class="mb">Welcome, ${esc(u.full_name || "there")}</h1>
        <p class="hero-lead" style="margin: 0 0 24px 0; text-align: left;">Manage and track your car purchase requests with Magerwa. Find a new car and submit a request in minutes.</p>
        <a href="/" class="btn btn-primary">Browse cars</a>
      </div>`;
  }

  function renderProfile() {
    const u = Session.user() || {};
    const el = document.querySelector("[data-profile]");
    el.innerHTML = `
      <div class="detail-info">
        <div class="spec-list">
          ${row("Full name", u.full_name)}
          ${row("Email", u.email)}
          ${row("National ID", u.national_id, true)}
          ${row("Telephone", u.telephone, true)}
          ${row("Address", u.address)}
        </div>
      </div>`;
  }

  function row(label, val, mono) {
    return `<div>
      <div class="s-l">${esc(label)}</div>
      <div class="s-v ${mono ? "cell-mono" : ""}">${esc(val || "—")}</div>
    </div>`;
  }

  async function loadOrders() {
    const wrap = document.querySelector("[data-orders]");
    wrap.innerHTML = `<div class="spinner"></div>`;
    try {
      const res = await Api.myOrders();
      const items = res.data || res || [];
      if (!items.length) {
        wrap.innerHTML = `<div class="empty">You haven't requested any cars yet.
          <br><a class="y" href="/" style="color:var(--accent);font-weight:700">Browse the showroom</a> to get started.</div>`;
        return;
      }
      wrap.innerHTML = `<div class="portal-grid">` + items.map(orderCard).join("") + `</div>`;
      wrap.querySelectorAll("[data-cancel]").forEach((b) => {
        b.addEventListener("click", () => cancel(b.dataset.cancel, b));
      });
      initReveal();
    } catch (err) {
      wrap.innerHTML = `<div class="empty">Couldn't load your requests. ${esc((err && err.message) || "")}</div>`;
    }
  }

  function orderCard(o) {
    const v = o.vehicle || {};
    const title = esc((v.manufacture_company || "") + " " + (v.model_name || "Vehicle"));
    const cancelBtn = o.status === "pending"
      ? `<button class="btn btn-ghost btn-sm" data-cancel="${esc(String(o.id))}"
           style="margin-top: 10px">Cancel request</button>`
      : "";
    return `
      <div class="order-card reveal">
        <img src="${esc(carImg(v))}" alt="${title}" loading="lazy">
        <div class="order-info">
          <div class="car-card__title">${title}</div>
          <div class="car-card__meta">Requested ${fmtDate(o.created_at)}</div>
          <div class="car-card__foot" style="border:0;padding:0;margin-top:8px">
            <span class="price">${money(o.price)}</span>
            ${orderBadge(o.status)}
          </div>
          ${cancelBtn}
        </div>
      </div>`;
  }

  async function cancel(id, btn) {
    btn.disabled = true; btn.textContent = "Cancelling…";
    try {
      await Api.cancelOrder(id);
      await loadOrders();
    } catch (err) {
      btn.disabled = false; btn.textContent = "Cancel request";
      alert(fieldError(err));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!Session.isClient()) { location.href = "/login"; return; }
    renderNav();
    renderHero();
    renderProfile();
    loadOrders();
  });
})();
