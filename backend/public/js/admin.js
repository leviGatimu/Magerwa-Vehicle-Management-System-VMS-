/* =========================================================
   Magerwa — Admin dashboard
   Tabs, lazy-loaded panels, filters, pagination, CRUD modals.
   ========================================================= */
(function () {
  // ---- Guard ----
  if (!Session.isAdmin()) { location.href = "/admin"; return; }

  /* ---------- small helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const debounce = (fn, ms = 350) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    return `<span class="badge ${esc(s)}">${esc(s || "—")}</span>`;
  }
  function vehicleLabel(v) {
    if (!v) return "—";
    const co = v.manufacture_company || v.manufacturer || "";
    return esc([co, v.model_name].filter(Boolean).join(" ") || "Vehicle");
  }
  function fmtDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt) ? esc(d) : dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  function spinnerInto(tbody, cols) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="spinner"></div></td></tr>`;
  }
  function emptyInto(tbody, cols, msg) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty">${esc(msg)}</div></td></tr>`;
  }
  function errorInto(tbody, cols, msg) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty">${esc(msg)}</div></td></tr>`;
  }

  /* ---------- pagination renderer ---------- */
  function renderPager(el, meta, onGo) {
    el.innerHTML = "";
    if (!meta || !meta.last_page || meta.last_page <= 1) return;
    const cur = meta.current_page, last = meta.last_page;
    const mk = (label, page, opts = {}) => {
      const b = document.createElement("button");
      b.textContent = label;
      if (opts.active) b.classList.add("active");
      if (opts.disabled) b.disabled = true;
      if (!opts.disabled && !opts.active) b.addEventListener("click", () => onGo(page));
      return b;
    };
    el.appendChild(mk("‹", cur - 1, { disabled: cur <= 1 }));
    const pages = [];
    for (let p = 1; p <= last; p++) {
      if (p === 1 || p === last || Math.abs(p - cur) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    pages.forEach((p) => {
      if (p === "…") {
        const s = document.createElement("button"); s.textContent = "…"; s.disabled = true; el.appendChild(s);
      } else {
        el.appendChild(mk(String(p), p, { active: p === cur }));
      }
    });
    el.appendChild(mk("›", cur + 1, { disabled: cur >= last }));
  }

  /* ---------- modal open/close ---------- */
  function openModal(id) { $(id).classList.add("open"); }
  function closeModal(id) { $(id).classList.remove("open"); }
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => closeModal(b.getAttribute("data-close")))
  );
  document.querySelectorAll(".modal-back").forEach((back) =>
    back.addEventListener("click", (e) => { if (e.target === back) back.classList.remove("open"); })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal-back.open").forEach((m) => m.classList.remove("open"));
  });

  function showAlert(id, msg) { const el = $(id); el.textContent = msg; el.style.display = "block"; }
  function hideAlert(id) { const el = $(id); el.textContent = ""; el.style.display = "none"; }

  /* ---------- topbar / session ---------- */
  const adminUser = Session.user() || {};
  $("admin-name").textContent = adminUser.full_name || adminUser.name || adminUser.email || "Administrator";
  $("logout-btn").addEventListener("click", async () => {
    try { await Api.adminLogout(); } catch (_) {}
    Session.clear();
    location.href = "/admin";
  });

  /* =========================================================
     TABS
     ========================================================= */
  const TITLES = { overview: "Overview", inventory: "Inventory", orders: "Orders", clients: "Clients", records: "Records" };
  const loaded = {};
  function switchTab(tab) {
    document.querySelectorAll(".nav-link").forEach((a) =>
      a.classList.toggle("active", a.getAttribute("data-tab") === tab));
    document.querySelectorAll(".panel").forEach((p) =>
      p.hidden = p.getAttribute("data-panel") !== tab);
    $("page-title").textContent = TITLES[tab] || "Dashboard";
    if (!loaded[tab]) { loaded[tab] = true; LOADERS[tab] && LOADERS[tab](); }
  }
  document.querySelectorAll(".nav-link").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); switchTab(a.getAttribute("data-tab")); })
  );

  /* =========================================================
     OVERVIEW
     ========================================================= */
  async function loadOverview() {
    const body = $("overview-body");
    body.innerHTML = `<div class="spinner"></div>`;
    try {
      const [stats, pending] = await Promise.all([
        Api.adminStats(),
        Api.adminOrders("?status=pending").catch(() => ({ data: [] })),
      ]);
      const cards = [
        { l: "Total vehicles", v: stats.vehicles, accent: true },
        { l: "Available", v: stats.available },
        { l: "Sold", v: stats.sold },
        { l: "Reserved", v: stats.reserved },
        { l: "Clients", v: stats.clients },
        { l: "Pending orders", v: stats.orders_pending },
        { l: "Revenue", v: money(stats.revenue), accent: true },
      ];
      const statHtml = cards.map((c) =>
        `<div class="stat${c.accent ? " accent" : ""}">
           <div class="k">${esc(c.v == null ? "0" : c.v)}</div>
           <div class="l">${esc(c.l)}</div>
         </div>`).join("");

      const orders = (pending && pending.data) ? pending.data : (Array.isArray(pending) ? pending : []);
      let recentHtml;
      if (!orders.length) {
        recentHtml = `<div class="empty">No pending orders right now.</div>`;
      } else {
        const rows = orders.slice(0, 6).map((o) => `
          <tr data-oid="${esc(o.id)}">
            <td class="cell-strong">${esc((o.client && o.client.full_name) || "—")}</td>
            <td>${vehicleLabel(o.vehicle)}</td>
            <td class="price">${money(o.price)}</td>
            <td>
              <button class="btn btn-primary btn-sm" data-ov-approve="${esc(o.id)}">Approve</button>
              <button class="btn btn-outline btn-sm" data-ov-reject="${esc(o.id)}">Reject</button>
            </td>
          </tr>`).join("");
        recentHtml = `
          <div class="table-card">
            <table class="table">
              <thead><tr><th>Client</th><th>Vehicle</th><th>Price</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      }

      body.innerHTML = `
        <div class="stat-grid">${statHtml}</div>
        <div class="section-head" style="margin-top:34px">
          <h2 class="section-title">Recent pending orders</h2>
          <span class="muted">Quick approve or reject</span>
        </div>
        ${recentHtml}`;

      // wire quick actions
      body.querySelectorAll("[data-ov-approve]").forEach((b) =>
        b.addEventListener("click", () => openApprove(b.getAttribute("data-ov-approve"), () => refreshAfterOrder())));
      body.querySelectorAll("[data-ov-reject]").forEach((b) =>
        b.addEventListener("click", () => quickReject(b.getAttribute("data-ov-reject"), () => refreshAfterOrder())));
    } catch (ex) {
      body.innerHTML = `<div class="empty">${esc(fieldError(ex))}</div>`;
    }
  }
  function refreshAfterOrder() {
    loadOverview();
    if (loaded.orders) loadOrders();
    if (loaded.inventory) loadInventory();
    if (loaded.records) loadRecords();
  }

  /* =========================================================
     INVENTORY
     ========================================================= */
  let invPage = 1;
  function invQs() {
    const p = new URLSearchParams();
    p.set("page", invPage);
    const q = $("inv-search").value.trim();
    const cat = $("inv-category").value;
    const st = $("inv-status").value;
    if (q) p.set("search", q);
    if (cat) p.set("category", cat);
    if (st) p.set("status", st);
    return "?" + p.toString();
  }
  async function loadInventory() {
    const tbody = $("inv-body");
    spinnerInto(tbody, 7);
    try {
      const res = await Api.vehicles(invQs());
      const rows = res.data || (Array.isArray(res) ? res : []);
      if (!rows.length) { emptyInto(tbody, 7, "No vehicles match your filters."); $("inv-pager").innerHTML = ""; return; }
      tbody.innerHTML = rows.map((v) => `
        <tr>
          <td class="cell-strong">${vehicleLabel(v)}</td>
          <td class="cell-mono">${esc(v.chassis_number)}</td>
          <td>${esc(v.manufacture_year)}</td>
          <td class="price">${money(v.price)}</td>
          <td>${esc(v.category)}</td>
          <td>${statusBadge(v.status)}</td>
          <td>
            <button class="btn btn-outline btn-sm" data-edit="${esc(v.id)}">Edit</button>
            <button class="btn btn-outline btn-sm" data-del="${esc(v.id)}">Delete</button>
          </td>
        </tr>`).join("");
      renderPager($("inv-pager"), res, (p) => { invPage = p; loadInventory(); });

      tbody.querySelectorAll("[data-edit]").forEach((b) =>
        b.addEventListener("click", () => openVehicleModal(b.getAttribute("data-edit"))));
      tbody.querySelectorAll("[data-del]").forEach((b) =>
        b.addEventListener("click", () => deleteVehicle(b.getAttribute("data-del"))));
    } catch (ex) {
      errorInto(tbody, 7, fieldError(ex));
    }
  }
  const invReload = () => { invPage = 1; loadInventory(); };
  $("inv-search").addEventListener("input", debounce(invReload));
  $("inv-category").addEventListener("change", invReload);
  $("inv-status").addEventListener("change", invReload);

  // ---- vehicle modal ----
  $("add-vehicle-btn").addEventListener("click", () => openVehicleModal(null));

  function setVehPreview(url) {
    const img = document.querySelector("#veh-img-preview img");
    if (url) {
      img.src = url; img.style.display = "block";
    } else {
      img.src = ""; img.style.display = "none";
    }
  }

  $("veh-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await Api.uploadVehicleImage(file);
      $("veh-image-url").value = res.url;
      setVehPreview(res.url);
      $("veh-image").value = ""; // clear preset if any
    } catch (ex) {
      showAlert("veh-err", fieldError(ex));
    }
  });

  $("veh-image").addEventListener("change", (e) => {
    const url = e.target.value;
    $("veh-image-url").value = url;
    setVehPreview(url);
    $("veh-file").value = ""; // clear file input
  });

  async function openVehicleModal(id) {
    hideAlert("veh-err");
    $("veh-form").reset();
    $("veh-id").value = "";
    $("veh-image-url").value = "";
    setVehPreview("");

    if (id == null) {
      $("veh-modal-title").textContent = "Add vehicle";
      openModal("veh-modal");
      return;
    }
    $("veh-modal-title").textContent = "Edit vehicle";
    openModal("veh-modal");
    try {
      const v = await Api.vehicle(id);
      const veh = v.data || v;
      $("veh-id").value = veh.id;
      $("veh-company").value = veh.manufacture_company || "";
      $("veh-model").value = veh.model_name || "";
      $("veh-manufacturer").value = veh.manufacturer || "";
      $("veh-chassis").value = veh.chassis_number || "";
      $("veh-year").value = veh.manufacture_year || "";
      $("veh-price").value = veh.price || "";
      if (veh.category) $("veh-category").value = veh.category;
      
      const imgUrl = veh.image_url || "";
      $("veh-image-url").value = imgUrl;
      setVehPreview(imgUrl);
      // Try to select preset if matches
      if ($("veh-image").querySelector(`option[value="${imgUrl}"]`)) {
        $("veh-image").value = imgUrl;
      }
    } catch (ex) {
      showAlert("veh-err", fieldError(ex));
    }
  }

  $("veh-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("veh-err");
    const id = $("veh-id").value;
    const body = {
      manufacture_company: $("veh-company").value.trim(),
      model_name: $("veh-model").value.trim(),
      manufacturer: $("veh-manufacturer").value.trim(),
      chassis_number: $("veh-chassis").value.trim(),
      manufacture_year: Number($("veh-year").value),
      price: Number($("veh-price").value),
      category: $("veh-category").value,
      image_url: $("veh-image-url").value || null,
    };
    const btn = $("veh-save"); btn.disabled = true; const lbl = btn.textContent; btn.textContent = "Saving…";
    try {
      if (id) await Api.updateVehicle(id, body);
      else await Api.createVehicle(body);
      closeModal("veh-modal");
      invReload();
      if (loaded.overview) loadOverview();
      if (loaded.records) loadRecords();
    } catch (ex) {
      showAlert("veh-err", fieldError(ex));
    } finally {
      btn.disabled = false; btn.textContent = lbl;
    }
  });
  async function deleteVehicle(id) {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    try {
      await Api.deleteVehicle(id);
      loadInventory();
      if (loaded.overview) loadOverview();
      if (loaded.records) loadRecords();
    } catch (ex) { alert(fieldError(ex)); }
  }

  /* =========================================================
     ORDERS
     ========================================================= */
  let ordPage = 1;
  function ordQs() {
    const p = new URLSearchParams();
    p.set("page", ordPage);
    const st = $("ord-status").value;
    if (st) p.set("status", st);
    return "?" + p.toString();
  }
  async function loadOrders() {
    const tbody = $("ord-body");
    spinnerInto(tbody, 6);
    try {
      const res = await Api.adminOrders(ordQs());
      const rows = res.data || (Array.isArray(res) ? res : []);
      if (!rows.length) { emptyInto(tbody, 6, "No orders found."); $("ord-pager").innerHTML = ""; return; }
      tbody.innerHTML = rows.map((o) => {
        const plate = o.vehicle && o.vehicle.plate_number;
        const isPending = String(o.status).toLowerCase() === "pending";
        const actions = isPending
          ? `<button class="btn btn-primary btn-sm" data-appr="${esc(o.id)}">Approve</button>
             <button class="btn btn-outline btn-sm" data-rej="${esc(o.id)}">Reject</button>`
          : (plate ? `<span class="cell-mono">${esc(plate)}</span>` : `<span class="muted">—</span>`);
        return `
          <tr>
            <td class="cell-strong">${esc((o.client && o.client.full_name) || "—")}</td>
            <td>${vehicleLabel(o.vehicle)}</td>
            <td class="price">${money(o.price)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>${fmtDate(o.created_at)}</td>
            <td>${actions}</td>
          </tr>`;
      }).join("");
      renderPager($("ord-pager"), res, (p) => { ordPage = p; loadOrders(); });

      tbody.querySelectorAll("[data-appr]").forEach((b) =>
        b.addEventListener("click", () => openApprove(b.getAttribute("data-appr"), afterOrderMutation)));
      tbody.querySelectorAll("[data-rej]").forEach((b) =>
        b.addEventListener("click", () => quickReject(b.getAttribute("data-rej"), afterOrderMutation)));
    } catch (ex) {
      errorInto(tbody, 6, fieldError(ex));
    }
  }
  function afterOrderMutation() {
    loadOrders();
    if (loaded.overview) loadOverview();
    if (loaded.inventory) loadInventory();
    if (loaded.records) loadRecords();
  }
  $("ord-status").addEventListener("change", () => { ordPage = 1; loadOrders(); });

  // ---- approve modal ----
  let approveCb = null;
  function openApprove(id, cb) {
    approveCb = cb;
    hideAlert("appr-err");
    $("appr-form").reset();
    $("appr-id").value = id;
    $("appr-sub").textContent = "Assign a license plate to complete this sale.";
    openModal("appr-modal");
    setTimeout(() => $("appr-plate").focus(), 50);
  }
  $("appr-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("appr-err");
    const id = $("appr-id").value;
    const plate = $("appr-plate").value.trim();
    if (!plate) { showAlert("appr-err", "Plate number is required."); return; }
    const btn = $("appr-save"); btn.disabled = true; const lbl = btn.textContent; btn.textContent = "Approving…";
    try {
      await Api.approveOrder(id, { plate_number: plate });
      closeModal("appr-modal");
      if (approveCb) approveCb();
    } catch (ex) {
      showAlert("appr-err", fieldError(ex));
    } finally {
      btn.disabled = false; btn.textContent = lbl;
    }
  });
  async function quickReject(id, cb) {
    if (!confirm("Reject this order?")) return;
    try {
      await Api.rejectOrder(id);
      if (cb) cb();
    } catch (ex) { alert(fieldError(ex)); }
  }

  /* =========================================================
     CLIENTS
     ========================================================= */
  let cliPage = 1;
  function cliQs() {
    const p = new URLSearchParams();
    p.set("page", cliPage);
    const q = $("cli-search").value.trim();
    if (q) p.set("search", q);
    return "?" + p.toString();
  }
  async function loadClients() {
    const tbody = $("cli-body");
    spinnerInto(tbody, 7);
    try {
      const res = await Api.clients(cliQs());
      const rows = res.data || (Array.isArray(res) ? res : []);
      if (!rows.length) { emptyInto(tbody, 7, "No clients found."); $("cli-pager").innerHTML = ""; return; }
      tbody.innerHTML = rows.map((c) => `
        <tr>
          <td class="cell-strong">${esc(c.full_name)}</td>
          <td>${esc(c.email)}</td>
          <td class="cell-mono">${esc(c.national_id)}</td>
          <td>${esc(c.telephone)}</td>
          <td>${esc(c.address)}</td>
          <td><span class="pill">${esc(c.vehicles_count != null ? c.vehicles_count : 0)}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" data-cedit="${esc(c.id)}">Edit</button>
            <button class="btn btn-outline btn-sm" data-cdel="${esc(c.id)}">Delete</button>
          </td>
        </tr>`).join("");
      renderPager($("cli-pager"), res, (p) => { cliPage = p; loadClients(); });

      // stash row data for edit modal
      const map = {};
      rows.forEach((c) => { map[c.id] = c; });
      tbody.querySelectorAll("[data-cedit]").forEach((b) =>
        b.addEventListener("click", () => openClientModal(map[b.getAttribute("data-cedit")])));
      tbody.querySelectorAll("[data-cdel]").forEach((b) =>
        b.addEventListener("click", () => deleteClient(b.getAttribute("data-cdel"))));
    } catch (ex) {
      errorInto(tbody, 7, fieldError(ex));
    }
  }
  const cliReload = () => { cliPage = 1; loadClients(); };
  $("cli-search").addEventListener("input", debounce(cliReload));

  function openClientModal(c) {
    if (!c) return;
    hideAlert("cli-err");
    $("cli-id").value = c.id;
    $("cli-name").value = c.full_name || "";
    $("cli-email").value = c.email || "";
    $("cli-national").value = c.national_id || "";
    $("cli-phone").value = c.telephone || "";
    $("cli-address").value = c.address || "";
    openModal("cli-modal");
  }
  $("cli-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("cli-err");
    const id = $("cli-id").value;
    const body = {
      full_name: $("cli-name").value.trim(),
      email: $("cli-email").value.trim(),
      national_id: $("cli-national").value.trim(),
      telephone: $("cli-phone").value.trim(),
      address: $("cli-address").value.trim(),
    };
    const btn = $("cli-save"); btn.disabled = true; const lbl = btn.textContent; btn.textContent = "Saving…";
    try {
      await Api.updateClient(id, body);
      closeModal("cli-modal");
      loadClients();
    } catch (ex) {
      showAlert("cli-err", fieldError(ex));
    } finally {
      btn.disabled = false; btn.textContent = lbl;
    }
  });
  async function deleteClient(id) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    try {
      await Api.deleteClient(id);
      loadClients();
      if (loaded.overview) loadOverview();
    } catch (ex) { alert(fieldError(ex)); }
  }

  /* =========================================================
     RECORDS (read-only)
     ========================================================= */
  let recPage = 1;
  async function loadRecords() {
    const tbody = $("rec-body");
    spinnerInto(tbody, 6);
    try {
      const res = await Api.records("?page=" + recPage);
      const rows = res.data || (Array.isArray(res) ? res : []);
      if (!rows.length) { emptyInto(tbody, 6, "No records found."); $("rec-pager").innerHTML = ""; return; }
      tbody.innerHTML = rows.map((r) => {
        // record may be a vehicle row with nested client, or a join row
        const v = r.vehicle || r;
        const client = r.client || (v && v.client);
        const owner = (client && client.full_name) || "—";
        const plate = v.plate_number || r.plate_number;
        return `
          <tr>
            <td class="cell-strong">${vehicleLabel(v)}</td>
            <td class="cell-mono">${esc(v.chassis_number)}</td>
            <td>${esc(owner)}</td>
            <td>${plate ? `<span class="cell-mono">${esc(plate)}</span>` : `<span class="muted">—</span>`}</td>
            <td class="price">${money(v.price != null ? v.price : r.price)}</td>
            <td>${statusBadge(v.status != null ? v.status : r.status)}</td>
          </tr>`;
      }).join("");
      renderPager($("rec-pager"), res, (p) => { recPage = p; loadRecords(); });
    } catch (ex) {
      errorInto(tbody, 6, fieldError(ex));
    }
  }

  /* ---------- loader registry + boot ---------- */
  const LOADERS = {
    overview: loadOverview,
    inventory: loadInventory,
    orders: loadOrders,
    clients: loadClients,
    records: loadRecords,
  };
  // default tab
  loaded.overview = true;
  switchTab("overview");
})();
