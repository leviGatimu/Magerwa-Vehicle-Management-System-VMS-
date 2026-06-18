/* =========================================================
   Magerwa — Admin login page
   ========================================================= */
(function () {
  // Already signed in as admin → straight to dashboard.
  if (Session.isAdmin()) { location.href = "/admin/dashboard"; return; }

  const form = document.getElementById("login-form");
  const err = document.getElementById("err");
  const btn = document.getElementById("submit-btn");

  function showError(msg) {
    err.textContent = msg;
    err.classList.add("error");
    err.style.display = "block";
  }
  function clearError() {
    err.textContent = "";
    err.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Signing in…";

    try {
      const res = await Api.adminLogin({ email, password });
      // Expected: { token, user } (or { token, admin })
      const token = res.token || (res.data && res.data.token);
      const admin = res.user || res.admin || (res.data && (res.data.user || res.data.admin)) || res;
      if (!token) throw { message: "Login failed — no token returned." };
      Session.set(token, "admin", admin);
      location.href = "/admin/dashboard";
    } catch (ex) {
      showError(fieldError(ex));
      btn.disabled = false;
      btn.textContent = label;
    }
  });
})();
