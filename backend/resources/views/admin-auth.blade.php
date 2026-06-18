<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magerwa · Admin — Sign in</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="brand"><span class="dot">M</span> MAGERWA <span class="muted">· Admin</span></div>
      <h1>Admin sign in</h1>
      <p class="sub">Manage inventory, orders and clients for the Magerwa bonded warehouse.</p>

      <div class="alert error" id="err"></div>

      <form id="login-form" autocomplete="off">
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="admin@magerwa.rw" placeholder="admin@magerwa.rw" required>
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" value="password123" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="submit-btn">Sign in</button>
      </form>

      <div class="auth-switch"><a href="/">&larr; Back to storefront</a></div>
    </div>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/admin-auth.js"></script>
</body>
</html>
