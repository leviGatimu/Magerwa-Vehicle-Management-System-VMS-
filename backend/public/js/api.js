/* =========================================================
   Magerwa VTMS — shared API client + helpers (vanilla JS)
   Same-origin (served by `php artisan serve`). Used by every page.
   localStorage: vtms_token, vtms_role ('admin'|'client'), vtms_user (JSON)
   ========================================================= */
const API = "/api";

const Session = {
  token: () => localStorage.getItem("vtms_token"),
  role: () => localStorage.getItem("vtms_role"),
  user: () => { try { return JSON.parse(localStorage.getItem("vtms_user")); } catch { return null; } },
  set(token, role, user) {
    localStorage.setItem("vtms_token", token);
    localStorage.setItem("vtms_role", role);
    localStorage.setItem("vtms_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("vtms_token");
    localStorage.removeItem("vtms_role");
    localStorage.removeItem("vtms_user");
  },
  isAuthed: () => !!localStorage.getItem("vtms_token"),
  isClient: () => localStorage.getItem("vtms_role") === "client",
  isAdmin: () => localStorage.getItem("vtms_role") === "admin",
};

async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (auth && Session.token()) headers["Authorization"] = `Bearer ${Session.token()}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);

  if (res.status === 401 && auth) {
    const wasAdmin = Session.isAdmin();
    Session.clear();
    location.href = wasAdmin ? "/admin" : "/login";
    throw { status: 401, message: "Session expired." };
  }

  let data = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    throw { status: res.status, message: (data && data.message) || "Request failed.", errors: (data && data.errors) || null };
  }
  return data;
}

const Api = {
  // ---- Public (no auth) ----
  publicVehicles: (qs = "") => apiFetch(`/public/vehicles${qs}`, { auth: false }),
  publicVehicle: (id) => apiFetch(`/public/vehicles/${id}`, { auth: false }),
  publicStats: () => apiFetch(`/public/stats`, { auth: false }),

  // ---- Client auth ----
  clientRegister: (b) => apiFetch(`/client/register`, { method: "POST", body: b, auth: false }),
  clientLogin: (b) => apiFetch(`/client/login`, { method: "POST", body: b, auth: false }),
  clientLogout: () => apiFetch(`/client/logout`, { method: "POST" }),
  clientMe: () => apiFetch(`/client/me`),

  // ---- Client actions ----
  myOrders: () => apiFetch(`/client/orders`),
  buy: (vehicle_id) => apiFetch(`/client/orders`, { method: "POST", body: { vehicle_id } }),
  cancelOrder: (id) => apiFetch(`/client/orders/${id}`, { method: "DELETE" }),

  // ---- Admin auth ----
  adminLogin: (b) => apiFetch(`/auth/login`, { method: "POST", body: b, auth: false }),
  adminRegister: (b) => apiFetch(`/auth/register`, { method: "POST", body: b, auth: false }),
  adminLogout: () => apiFetch(`/auth/logout`, { method: "POST" }),
  adminMe: () => apiFetch(`/auth/me`),

  // ---- Admin: stats / inventory / clients / orders ----
  adminStats: () => apiFetch(`/admin/stats`),
  vehicles: (qs = "") => apiFetch(`/vehicles${qs}`),
  vehicle: (id) => apiFetch(`/vehicles/${id}`),
  createVehicle: (b) => apiFetch(`/vehicles`, { method: "POST", body: b }),
  updateVehicle: (id, b) => apiFetch(`/vehicles/${id}`, { method: "PUT", body: b }),
  deleteVehicle: (id) => apiFetch(`/vehicles/${id}`, { method: "DELETE" }),
  clients: (qs = "") => apiFetch(`/clients${qs}`),
  updateClient: (id, b) => apiFetch(`/clients/${id}`, { method: "PUT", body: b }),
  deleteClient: (id) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
  adminOrders: (qs = "") => apiFetch(`/admin/orders${qs}`),
  approveOrder: (id, b) => apiFetch(`/admin/orders/${id}/approve`, { method: "POST", body: b }),
  rejectOrder: (id) => apiFetch(`/admin/orders/${id}/reject`, { method: "POST" }),
  records: (qs = "") => apiFetch(`/records${qs}`),
  uploadVehicleImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return fetch(`${API}/vehicles/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${Session.token()}`, "Accept": "application/json" },
      body: fd
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    });
  },
};

/* ---------- shared UI helpers ---------- */
const Theme = {
  get: () => localStorage.getItem("vtms_theme") || "dark",
  set(t) {
    localStorage.setItem("vtms_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  },
  toggle() { this.set(this.get() === "dark" ? "light" : "dark"); },
  apply() { document.documentElement.setAttribute("data-theme", this.get()); }
};
Theme.apply();

function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(v) {
  const n = Number(v);
  return isNaN(n) ? "$0" : "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
// Vehicle image URL (self-hosted in /assets/cars/). Falls back to a neutral car photo.
function carImg(v) {
  return (v && v.image_url) ? v.image_url : "/assets/cars/mercedes_cla.jpg";
}
function qsParam(name) { return new URLSearchParams(location.search).get(name); }

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.1 });
  els.forEach((e) => io.observe(e));
}
function fieldError(err) {
  let m = err.message || "Something went wrong.";
  if (err.errors) m = Object.values(err.errors).flat().join(" ");
  return m;
}
