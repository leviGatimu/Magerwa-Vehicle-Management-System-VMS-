<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magerwa · Admin — Dashboard</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="admin-layout">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand"><span class="dot">M</span> MAGERWA <span class="muted">· Admin</span></div>
      <nav class="admin-nav">
        <a href="#" class="nav-link active" data-tab="overview">Overview</a>
        <a href="#" class="nav-link" data-tab="inventory">Inventory</a>
        <a href="#" class="nav-link" data-tab="orders">Orders</a>
        <a href="#" class="nav-link" data-tab="clients">Clients</a>
        <a href="#" class="nav-link" data-tab="records">Records</a>
      </nav>
    </aside>

    <!-- Main -->
    <div class="admin-main">
      <header class="admin-topbar">
        <h1 class="topbar-title" id="page-title">Overview</h1>
        <div class="nav-right">
          <span class="nav-user" id="admin-name"></span>
          <button class="btn btn-outline btn-sm" id="logout-btn">Log out</button>
        </div>
      </header>

      <!-- ============ OVERVIEW ============ -->
      <section class="panel" data-panel="overview">
        <div id="overview-body">
          <div class="spinner"></div>
        </div>
      </section>

      <!-- ============ INVENTORY ============ -->
      <section class="panel" data-panel="inventory" hidden>
        <div class="section-head">
          <h2 class="section-title">Inventory</h2>
          <button class="btn btn-primary" id="add-vehicle-btn">+ Add vehicle</button>
        </div>
        <div class="toolbar">
          <input type="text" id="inv-search" placeholder="Search company, model or chassis…">
          <select id="inv-category">
            <option value="">All categories</option>
            <option value="Economy">Economy</option>
            <option value="Luxury">Luxury</option>
            <option value="SUV">SUV</option>
            <option value="Sport">Sport</option>
            <option value="Exotic">Exotic</option>
          </select>
          <select id="inv-status">
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div class="table-card">
          <table class="table" id="inv-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Chassis</th><th>Year</th><th>Price</th>
                <th>Category</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="inv-body"></tbody>
          </table>
          <div class="pager" id="inv-pager"></div>
        </div>
      </section>

      <!-- ============ ORDERS ============ -->
      <section class="panel" data-panel="orders" hidden>
        <div class="section-head">
          <h2 class="section-title">Orders</h2>
        </div>
        <div class="toolbar">
          <select id="ord-status">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div class="table-card">
          <table class="table" id="ord-table">
            <thead>
              <tr>
                <th>Client</th><th>Vehicle</th><th>Price</th>
                <th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="ord-body"></tbody>
          </table>
          <div class="pager" id="ord-pager"></div>
        </div>
      </section>

      <!-- ============ CLIENTS ============ -->
      <section class="panel" data-panel="clients" hidden>
        <div class="section-head">
          <h2 class="section-title">Clients</h2>
        </div>
        <div class="toolbar">
          <input type="text" id="cli-search" placeholder="Search name, email or national ID…">
        </div>
        <div class="table-card">
          <table class="table" id="cli-table">
            <thead>
              <tr>
                <th>Full name</th><th>Email</th><th>National ID</th>
                <th>Telephone</th><th>Address</th><th>Vehicles</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="cli-body"></tbody>
          </table>
          <div class="pager" id="cli-pager"></div>
        </div>
      </section>

      <!-- ============ RECORDS ============ -->
      <section class="panel" data-panel="records" hidden>
        <div class="section-head">
          <h2 class="section-title">Records</h2>
          <span class="muted">Who owns what · plate registry</span>
        </div>
        <div class="table-card">
          <table class="table" id="rec-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Chassis</th><th>Owner</th>
                <th>Plate</th><th>Price</th><th>Status</th>
              </tr>
            </thead>
            <tbody id="rec-body"></tbody>
          </table>
          <div class="pager" id="rec-pager"></div>
        </div>
      </section>

    </div>
  </div>

  <!-- ============ Vehicle modal ============ -->
  <div class="modal-back" id="veh-modal">
    <div class="modal">
      <h2 id="veh-modal-title">Add vehicle</h2>
      <div class="alert error" id="veh-err"></div>
      <form id="veh-form" autocomplete="off">
        <input type="hidden" id="veh-id">
        <div class="row2">
          <div class="field">
            <label for="veh-company">Manufacture company</label>
            <input type="text" id="veh-company" placeholder="Mercedes-Benz" required>
          </div>
          <div class="field">
            <label for="veh-model">Model name</label>
            <input type="text" id="veh-model" placeholder="CLA 250" required>
          </div>
        </div>
        <div class="row2">
          <div class="field">
            <label for="veh-manufacturer">Manufacturer</label>
            <input type="text" id="veh-manufacturer" placeholder="Daimler AG">
          </div>
          <div class="field">
            <label for="veh-chassis">Chassis number</label>
            <input type="text" id="veh-chassis" placeholder="WDD1173441N123456" required>
          </div>
        </div>
        <div class="row2">
          <div class="field">
            <label for="veh-year">Manufacture year</label>
            <input type="number" id="veh-year" min="1950" max="2100" placeholder="2022" required>
          </div>
          <div class="field">
            <label for="veh-price">Price (USD)</label>
            <input type="number" id="veh-price" min="0" step="1" placeholder="42000" required>
          </div>
        </div>
        <div class="row2">
          <div class="field">
            <label for="veh-category">Category</label>
            <select id="veh-category" required>
              <option value="Economy">Economy</option>
              <option value="Luxury">Luxury</option>
              <option value="SUV">SUV</option>
              <option value="Sport">Sport</option>
              <option value="Exotic">Exotic</option>
            </select>
          </div>
          <div class="field">
            <label>Vehicle image</label>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div id="veh-img-preview" style="width:100px;height:70px;border-radius:8px;background:var(--surface-2);border:1px solid var(--line);overflow:hidden;flex-shrink:0">
                <img src="" style="width:100%;height:100%;object-fit:cover;display:none">
              </div>
              <div style="flex:1">
                <input type="file" id="veh-file" accept="image/*" style="display:none">
                <button type="button" class="btn btn-outline btn-sm btn-block" onclick="document.getElementById('veh-file').click()">Choose from laptop…</button>
                <div class="muted" style="font-size:0.75rem;margin-top:6px">Or pick a preset:</div>
                <select id="veh-image" style="margin-top:4px">
                  <option value="">— none —</option>
                  <option value="/assets/cars/mercedes_cla.jpg">Mercedes CLA</option>
                  <option value="/assets/cars/golf_gti.jpg">VW Golf GTI</option>
                  <option value="/assets/cars/corolla.jpg">Toyota Corolla</option>
                  <option value="/assets/cars/range_rover.jpg">Range Rover</option>
                  <option value="/assets/cars/lexus_is.jpg">Lexus IS</option>
                  <option value="/assets/cars/model_y.jpg">Tesla Model Y</option>
                  <option value="/assets/cars/ferrari.jpg">Ferrari</option>
                  <option value="/assets/cars/jaguar_xf.jpg">Jaguar XF</option>
                  <option value="/assets/cars/accord.jpg">Honda Accord</option>
                  <option value="/assets/cars/porsche911.jpg">Porsche 911</option>
                  <option value="/assets/cars/bmw530.jpg">BMW 530</option>
                  <option value="/assets/cars/ford_f150.jpg">Ford F-150</option>
                </select>
              </div>
            </div>
            <input type="hidden" id="veh-image-url">
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close="veh-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="veh-save">Save vehicle</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============ Client modal ============ -->
  <div class="modal-back" id="cli-modal">
    <div class="modal">
      <h2>Edit client</h2>
      <div class="alert error" id="cli-err"></div>
      <form id="cli-form" autocomplete="off">
        <input type="hidden" id="cli-id">
        <div class="row2">
          <div class="field">
            <label for="cli-name">Full name</label>
            <input type="text" id="cli-name" required>
          </div>
          <div class="field">
            <label for="cli-email">Email</label>
            <input type="email" id="cli-email" required>
          </div>
        </div>
        <div class="row2">
          <div class="field">
            <label for="cli-national">National ID</label>
            <input type="text" id="cli-national">
          </div>
          <div class="field">
            <label for="cli-phone">Telephone</label>
            <input type="text" id="cli-phone">
          </div>
        </div>
        <div class="field">
          <label for="cli-address">Address</label>
          <input type="text" id="cli-address">
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close="cli-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="cli-save">Save client</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============ Approve order modal ============ -->
  <div class="modal-back" id="appr-modal">
    <div class="modal">
      <h2>Approve order</h2>
      <p class="muted" id="appr-sub" style="margin-top:-8px"></p>
      <div class="alert error" id="appr-err"></div>
      <form id="appr-form" autocomplete="off">
        <input type="hidden" id="appr-id">
        <div class="field">
          <label for="appr-plate">Plate number</label>
          <input type="text" id="appr-plate" placeholder="RAD 123A" required>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close="appr-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="appr-save">Approve &amp; assign plate</button>
        </div>
      </form>
    </div>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/admin.js"></script>
</body>
</html>
