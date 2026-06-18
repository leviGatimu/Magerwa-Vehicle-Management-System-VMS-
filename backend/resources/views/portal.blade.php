<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Portal — Magerwa</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div data-nav></div>

  <main>
    <section class="section">
      <div class="container">
        <div class="portal-hero reveal" data-hero></div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <h2 class="section-title">My purchase requests</h2>
            <p class="muted">Track the status of every car you've requested.</p>
          </div>
        </div>
        <div data-orders></div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <h2 class="section-title">My profile</h2>
            <p class="muted">Your contact details on file at Magerwa.</p>
          </div>
        </div>
        <div data-profile></div>
      </div>
    </section>
  </main>

  <script src="/js/api.js"></script>
  <script src="/js/portal.js"></script>
</body>
</html>
