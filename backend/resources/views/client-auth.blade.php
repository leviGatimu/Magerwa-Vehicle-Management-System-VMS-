<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in — Magerwa</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="auth-wrap">
    <div class="auth-card">
      <a href="/" class="brand" style="margin-bottom: 24px"><span class="dot">M</span> MAGERWA</a>

      <div class="tabs" style="margin-bottom: 24px">
        <button class="tab active" data-tab="login">Login</button>
        <button class="tab" data-tab="register">Create account</button>
      </div>

      <div class="alert error" data-alert style="display:none"></div>

      <!-- LOGIN -->
      <form data-view="login">
        <h1>Welcome back</h1>
        <p class="sub">Sign in to manage your purchases.</p>
        <div class="field">
          <label for="l-email">Email</label>
          <input type="email" id="l-email" name="email" required>
        </div>
        <div class="field">
          <label for="l-password">Password</label>
          <input type="password" id="l-password" name="password" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Sign in</button>
        <p class="auth-switch">No account? <a href="#" data-tab="register">Create one</a></p>
      </form>

      <!-- REGISTER -->
      <form data-view="register" style="display:none">
        <h1>Create your account</h1>
        <p class="sub">Join Magerwa to request and track vehicle purchases.</p>
        <div class="field">
          <label for="r-name">Full name</label>
          <input type="text" id="r-name" name="full_name" required>
        </div>
        <div class="field">
          <label for="r-email">Email</label>
          <input type="email" id="r-email" name="email" required>
        </div>
        <div class="field">
          <label for="r-nid">National ID</label>
          <input type="text" id="r-nid" name="national_id" pattern="\d{16}" maxlength="16"
                 inputmode="numeric" placeholder="16 digits" required>
        </div>
        <div class="field">
          <label for="r-tel">Telephone</label>
          <input type="tel" id="r-tel" name="telephone" required>
        </div>
        <div class="field">
          <label for="r-addr">Address</label>
          <input type="text" id="r-addr" name="address" required>
        </div>
        <div class="field">
          <label for="r-password">Password</label>
          <input type="password" id="r-password" name="password" minlength="8" required>
        </div>
        <div class="field">
          <label for="r-password2">Confirm password</label>
          <input type="password" id="r-password2" name="password_confirmation" minlength="8" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create account</button>
        <p class="auth-switch">Already registered? <a href="#" data-tab="login">Sign in</a></p>
      </form>

      <p class="auth-switch" style="margin-top:22px">
        Are you staff? <a href="/admin">Admin login</a>
      </p>
    </div>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/client-auth.js"></script>
</body>
</html>
