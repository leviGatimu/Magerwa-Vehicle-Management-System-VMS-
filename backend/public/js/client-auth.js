/* Magerwa — client login / register */
(function () {
  "use strict";

  function showAlert(msg) {
    const a = document.querySelector("[data-alert]");
    a.textContent = msg;
    a.style.display = msg ? "block" : "none";
  }

  function switchTab(view) {
    document.querySelectorAll("[data-view]").forEach((f) => {
      f.style.display = f.dataset.view === view ? "" : "none";
    });
    document.querySelectorAll(".tabs [data-tab]").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === view);
    });
    showAlert("");
  }

  function bindTabs() {
    document.querySelectorAll("[data-tab]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(el.dataset.tab);
      });
    });
  }

  function redirectTarget() {
    return qsParam("redirect") || "/portal";
  }

  function bindLogin() {
    const form = document.querySelector('[data-view="login"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showAlert("");
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Signing in…";
      try {
        const res = await Api.clientLogin({
          email: form.email.value.trim(),
          password: form.password.value,
        });
        Session.set(res.token, "client", res.client || res.user || res.data);
        location.href = redirectTarget();
      } catch (err) {
        showAlert(fieldError(err));
        btn.disabled = false; btn.textContent = "Sign in";
      }
    });
  }

  function bindRegister() {
    const form = document.querySelector('[data-view="register"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showAlert("");
      if (form.password.value !== form.password_confirmation.value) {
        showAlert("Passwords do not match.");
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Creating…";
      try {
        const res = await Api.clientRegister({
          full_name: form.full_name.value.trim(),
          email: form.email.value.trim(),
          national_id: form.national_id.value.trim(),
          telephone: form.telephone.value.trim(),
          address: form.address.value.trim(),
          password: form.password.value,
          password_confirmation: form.password_confirmation.value,
        });
        Session.set(res.token, "client", res.client || res.user || res.data);
        location.href = "/portal";
      } catch (err) {
        showAlert(fieldError(err));
        btn.disabled = false; btn.textContent = "Create account";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (Session.isClient()) { location.href = "/portal"; return; }
    bindTabs();
    bindLogin();
    bindRegister();
    if (qsParam("mode") === "register") switchTab("register");
  });
})();
