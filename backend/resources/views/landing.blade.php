<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magerwa — Premium Cars in Rwanda</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div data-nav></div>

  <header class="hero">
    <div class="container reveal">
      <h1 class="hero-title">Find your next car at <span class="accent">Magerwa</span></h1>
      <p class="hero-lead">Rwanda's bonded-warehouse dealership. Browse import-ready vehicles cleared
        through Magerwa — luxury, SUVs, sports and everyday cars, all in one place.</p>

      <form class="hero-search" id="search-form" autocomplete="off">
        <input type="text" id="q" placeholder="Search make or model">
        <select id="category">
          <option value="">All categories</option>
          <option value="Economy">Economy</option>
          <option value="Luxury">Luxury</option>
          <option value="SUV">SUV</option>
          <option value="Sport">Sport</option>
          <option value="Exotic">Exotic</option>
        </select>
        <button type="submit" class="btn btn-primary">Search</button>
      </form>
    </div>
  </header>

  <section class="section" style="padding-top:32px">
    <div class="container">
      <div class="stat-grid reveal" data-stats></div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head reveal">
        <div>
          <h2>Browse by category</h2>
          <p class="muted">Pick a style — we'll filter the showroom for you.</p>
        </div>
      </div>
      <div class="cat-grid reveal" data-cats></div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head reveal">
        <div>
          <h2>Browse our cars</h2>
          <p class="muted" data-results-sub>Available right now at Magerwa.</p>
        </div>
      </div>
      <div data-cars></div>
      <div class="pager" data-pager></div>
    </div>
  </section>

  <script src="/js/api.js"></script>
  <script src="/js/landing.js"></script>
</body>
</html>
