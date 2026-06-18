# Magerwa Vehicle Tracking Management System (VTMS)
### Full Implementation Plan & Developer Handover Document

**Prepared for:** Lead Full-Stack Developer
**Client:** Magerwa Ltd — Rwanda's public bonded warehouse
**Author:** [Your name], Contracted Full-Stack Developer
**Status:** Build-ready specification

---

## 1. Executive Summary

Magerwa needs an internal system that lets authorised staff (admins) record clients, record vehicles held/processed at the warehouse, link each vehicle to its owning client, assign a unique plate number, and browse everything in a clean, paginated, dealership-grade interface. The public-facing "wow" is a showroom-style UI with interactive 3D car views; the operational core is a secured admin CRUD system backed by a REST API and MySQL.

The whole thing splits cleanly into two deliverables that talk over HTTP/JSON:

- **Backend** — Laravel REST API + MySQL (the system of record). Every write/read goes through authenticated endpoints.
- **Frontend** — HTML + CSS + Bootstrap 5 single-page-ish dealership UI that consumes the API, plus an interactive 3D vehicle viewer.

Data can be entered three ways (all hitting the same API/DB): the frontend forms, Postman, or directly in phpMyAdmin.

---

## 2. Technology Stack (decided, with rationale)

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **Laravel 11 (PHP 8.2+)** | The brief allows native PHP / CodeIgniter / Laravel. Laravel is chosen because the requirements map 1:1 onto built-in features: token API auth (Sanctum), validation, Eloquent relationships (client↔vehicle), built-in pagination, password hashing, CSRF, migrations. This removes ~80% of the security footguns of hand-rolled PHP and is faster to build correctly. |
| API auth | **Laravel Sanctum (Bearer tokens)** | Stateless tokens work identically for the frontend *and* Postman, satisfying "API accessed by logged-in admins only." |
| DB | **MySQL 8** via **phpMyAdmin** | Required by client. |
| Frontend | **HTML5 + CSS3 + Bootstrap 5** | Required by client. Bootstrap gives the responsive grid; custom CSS layers the glassmorphism + scroll animations. |
| 3D viewer | **Google `<model-viewer>`** (+ optional Sketchfab embeds) | See §9. Self-hosted GLB models, interactive orbit/zoom, mobile + AR support, zero 3D programming required. |
| Vehicle data assist | **NHTSA vPIC API** (free, no key) | Optional: auto-fill / validate manufacturer + model from chassis (VIN). See §9.3. |
| HTTP client (frontend) | **Fetch API** (vanilla JS) | No build step needed; keeps the "HTML/CSS/Bootstrap" constraint clean. |

> If the lead dev strongly prefers **native PHP**, the same schema, endpoints, and security checklist below all still apply — they would just hand-implement routing, PDO prepared statements, `password_hash()`, and a token table. Laravel is the recommended path; this document is written for it but is portable.

---

## 3. System Architecture

```
┌─────────────────────────────┐         HTTPS / JSON          ┌──────────────────────────────┐
│        FRONTEND             │  ───────────────────────────▶ │          BACKEND               │
│  HTML + Bootstrap 5 + CSS   │   Authorization: Bearer <tok> │     Laravel 11 REST API        │
│  Vanilla JS (Fetch)         │ ◀─────────────────────────── │   Sanctum auth middleware      │
│  <model-viewer> 3D showroom │         JSON responses        │   Controllers + Validation     │
└─────────────────────────────┘                               │   Eloquent Models              │
        │                                                      └───────────────┬────────────────┘
        │ also entered via                                                     │
        ▼                                                                      ▼
   Postman / phpMyAdmin  ───────────────────────────────────────────▶   MySQL 8 (system of record)
```

**Core entities:** `Admin` (the only user type), `Client`, `Vehicle`. A vehicle belongs to one client and carries one unique plate number. One client can own many vehicles (1-to-many).

---

## 4. Database Schema

Four tables: `admins`, `personal_access_tokens` (Sanctum, auto-created), `clients`, `vehicles`. Below is the canonical MySQL DDL — equivalent to what Laravel migrations will generate. The lead dev should implement these as migrations, not raw SQL, but this is the source of truth for structure.

```sql
-- =========================================================
--  MAGERWA VTMS — MySQL Schema
-- =========================================================

CREATE TABLE admins (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    phone           VARCHAR(20)         NOT NULL,
    national_id     VARCHAR(20)         NOT NULL UNIQUE,   -- Rwandan NID = 16 digits
    password        VARCHAR(255)        NOT NULL,          -- bcrypt/argon hash, never plaintext
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clients (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150)        NOT NULL,
    national_id     VARCHAR(20)         NOT NULL UNIQUE,
    telephone       VARCHAR(20)         NOT NULL,
    address         VARCHAR(255)        NOT NULL,
    created_by      BIGINT UNSIGNED     NULL,              -- which admin registered them
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    CONSTRAINT fk_clients_admin FOREIGN KEY (created_by)
        REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicles (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chassis_number      VARCHAR(50)     NOT NULL UNIQUE,   -- VIN / chassis, globally unique
    manufacture_company VARCHAR(100)    NOT NULL,          -- e.g. Mercedes-Benz
    manufacturer        VARCHAR(100)    NOT NULL,          -- assembling manufacturer (may differ)
    manufacture_year    SMALLINT        NOT NULL,
    price               DECIMAL(12,2)   NOT NULL,
    model_name          VARCHAR(100)    NOT NULL,          -- e.g. CLA250
    -- Linkage fields (Task 4) — nullable until linked:
    client_id           BIGINT UNSIGNED NULL,
    plate_number        VARCHAR(20)     NULL UNIQUE,       -- assigned at linkage time
    model_3d_uid        VARCHAR(120)    NULL,              -- GLB path or Sketchfab UID for the showroom
    status              ENUM('unlinked','linked') NOT NULL DEFAULT 'unlinked',
    created_by          BIGINT UNSIGNED NULL,
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    CONSTRAINT fk_vehicles_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_vehicles_admin FOREIGN KEY (created_by)
        REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_vehicles_client (client_id),
    INDEX idx_vehicles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Design notes for the lead dev**
- `chassis_number` and `plate_number` are both `UNIQUE` — the DB enforces "one plate, one chassis" even if app validation is bypassed (e.g. data entered via phpMyAdmin).
- A vehicle is created **unlinked** (Task 3) and becomes **linked** when an admin attaches a client + plate (Task 4). This matches the real warehouse flow: a car arrives and is recorded before its owner paperwork is finalised.
- `model_3d_uid` lets each vehicle point at a 3D asset for the showroom without coupling the DB to any 3D provider.
- Keep `created_by` for a basic audit trail; it's cheap and Magerwa will likely want "who entered this."

---

## 5. API Design

Base URL: `/api`. All responses JSON. All endpoints **except register/login** require `Authorization: Bearer <token>` and are wrapped in Sanctum's `auth:sanctum` middleware.

### 5.1 Auth (Task 1)
| Method | Endpoint | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | full_name, email, phone, national_id, password, password_confirmation | Create admin account |
| POST | `/api/auth/login` | public | email, password | Returns `{ token, admin }` |
| POST | `/api/auth/logout` | bearer | — | Revoke current token |
| GET | `/api/auth/me` | bearer | — | Current admin profile |

### 5.2 Clients (Task 2)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/clients?page=N&search=` | bearer | Paginated, searchable list |
| POST | `/api/clients` | bearer | Register client (full_name, national_id, telephone, address) |
| GET | `/api/clients/{id}` | bearer | One client + their vehicles |
| PUT | `/api/clients/{id}` | bearer | Update client |
| DELETE | `/api/clients/{id}` | bearer | Remove client |

### 5.3 Vehicles (Task 3)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/vehicles?page=N&status=&search=` | bearer | Paginated list (filter unlinked/linked) |
| POST | `/api/vehicles` | bearer | Register vehicle (chassis_number, manufacture_company, manufacturer, manufacture_year, price, model_name) |
| GET | `/api/vehicles/{id}` | bearer | Full vehicle detail (for the 3D detail page) |
| PUT | `/api/vehicles/{id}` | bearer | Update vehicle |
| DELETE | `/api/vehicles/{id}` | bearer | Remove vehicle |

### 5.4 Linkage & Display (Task 4)
| Method | Endpoint | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/api/vehicles/{id}/link` | bearer | client_id, plate_number | Link vehicle to client + assign unique plate; sets status=linked |
| POST | `/api/vehicles/{id}/unlink` | bearer | — | Detach (e.g. correcting a mistake) |
| GET | `/api/records?page=N` | bearer | — | Paginated joined view: vehicle + owning client + plate, for the main records table |

**Pagination contract** (Laravel's paginator gives this for free):
```json
{
  "data": [ ... ],
  "current_page": 1,
  "last_page": 7,
  "per_page": 10,
  "total": 64
}
```

### 5.5 Sample controller (the pattern to copy everywhere)
```php
// app/Http/Controllers/VehicleController.php
public function store(Request $request)
{
    $data = $request->validate([
        'chassis_number'      => ['required','string','max:50','unique:vehicles,chassis_number'],
        'manufacture_company' => ['required','string','max:100'],
        'manufacturer'        => ['required','string','max:100'],
        'manufacture_year'    => ['required','integer','min:1950','max:'.(date('Y')+1)],
        'price'               => ['required','numeric','min:0'],
        'model_name'          => ['required','string','max:100'],
    ]);
    $data['created_by'] = $request->user()->id;
    $vehicle = Vehicle::create($data);
    return response()->json($vehicle, 201);
}

public function link(Request $request, Vehicle $vehicle)
{
    $data = $request->validate([
        'client_id'    => ['required','exists:clients,id'],
        'plate_number' => ['required','string','max:20','unique:vehicles,plate_number'],
    ]);
    $vehicle->update([
        'client_id'    => $data['client_id'],
        'plate_number' => $data['plate_number'],
        'status'       => 'linked',
    ]);
    return response()->json($vehicle->load('client'));
}
```

---

## 6. Authentication & Security Plan

This is an internal government-adjacent system holding national IDs — security is not optional. The lead dev must implement **all** of the following.

**Authentication**
- Admins register/login → receive a **Sanctum bearer token**. Store it client-side (see §8 note on storage).
- Every API route except `register`/`login` sits behind `auth:sanctum`. A request with no/invalid token gets `401`. This directly satisfies *"API must be accessed by logged-in admins only."*
- Passwords hashed with Laravel's default (bcrypt). **Never** store or log plaintext.

**Validation & integrity**
- Server-side validation on every endpoint (the `validate()` call). Frontend validation is UX only — never trusted.
- DB-level `UNIQUE` on email, national_id, chassis_number, plate_number as a second line of defence.
- Rwandan National ID is 16 digits — validate format (`regex:/^\d{16}$/`) on both admin and client NID.

**Standard hardening checklist**
- [ ] SQL injection — use Eloquent / parameter binding only. No raw string-interpolated queries.
- [ ] XSS — escape all output on the frontend; never `innerHTML` raw API strings (use `textContent` or sanitise).
- [ ] CSRF — Sanctum handles this for cookie sessions; for the pure token API, CSRF is N/A but keep tokens out of URLs.
- [ ] Rate limit `login` (`throttle:5,1`) to stop brute force.
- [ ] CORS — restrict `config/cors.php` to the frontend origin only, not `*`.
- [ ] HTTPS in production (no tokens over plaintext HTTP).
- [ ] `.env` never committed; DB credentials and `APP_KEY` stay server-side.
- [ ] Generic auth errors ("invalid credentials") — don't reveal whether email exists.
- [ ] Mass-assignment — set `$fillable` on every model explicitly.

---

## 7. Frontend Plan — the dealership experience

Goal (client's words): *"a very good dealership-like experience, look very good, fluid scrolling, translucent glass-ish design, exactly like the image."* That reference is the **bydrive** layout: white airy hero, a featured car floating over a soft radial blob, a "starting from $X" price bubble, brand logo strip, trending cards, and a category grid. We rebuild that language, then add live 3D.

### 7.1 Pages / sections
1. **Login / Register** — centered glass card on a blurred automotive background. Clean, no clutter.
2. **Dashboard (home / showroom)**
   - Hero: featured vehicle rendered live in `<model-viewer>` (auto-rotating), price bubble, "See All Specifications" CTA.
   - Stat strip: total vehicles, linked, unlinked, clients (translucent cards like the reference's "No credit card needed" row).
   - Brand logo strip (Mercedes, VW, Toyota, etc.).
   - **Trending / latest vehicles** cards (pulled from `/api/vehicles`).
   - **Categories** grid (Economy, Luxury, SUV, Sport, Exotic) — visual, links into filtered records.
3. **Records table** — the operational heart. Paginated table from `/api/records`: chassis, model, company, year, price, **owning client**, **plate number**, status badge, actions. Search + status filter.
4. **Add Client** / **Add Vehicle** — glass modal forms.
5. **Link Vehicle** — pick an unlinked vehicle, choose a client (searchable dropdown), type a plate number → submit.
6. **Vehicle detail page** — full-screen interactive 3D model, spec sheet beside it, owner card. This is the "full detailed interactable car page" the client asked for.

### 7.2 Visual system (glassmorphism + motion)
**Glass card — drop-in CSS:**
```css
:root{
  --glass-bg: rgba(255,255,255,0.55);
  --glass-border: rgba(255,255,255,0.7);
  --ink:#0f1115; --muted:#6b7280; --accent:#1f2937;
}
.glass{
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(17,17,26,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
}
.hero-blob{ /* the soft circle behind the featured car */
  background: radial-gradient(circle at 50% 45%, #e9edf3 0%, #cfd6e0 60%, transparent 70%);
  filter: blur(2px);
}
```
- **Fluid scrolling:** `html{ scroll-behavior:smooth; }` + reveal-on-scroll using `IntersectionObserver` (fade + translateY). Keep it tasteful; subtle parallax on the hero blob.
- **Translucency:** apply `.glass` to the navbar, stat cards, modals, and the category tiles — directly mirrors the reference.
- **Responsiveness:** Bootstrap grid; the 3D viewer collapses above the spec sheet on mobile. Test at 360 / 768 / 1280.
- Lean on the **frontend-design** practices: one accent colour, generous whitespace, consistent radius, real type scale — don't over-decorate.

### 7.3 Talking to the API (vanilla pattern)
```js
const API = "http://localhost:8000/api";
function authHeaders(){
  return { "Content-Type":"application/json",
           "Authorization":`Bearer ${getToken()}` };
}
async function loadRecords(page=1){
  const res = await fetch(`${API}/records?page=${page}`, { headers: authHeaders() });
  if(res.status === 401){ location.href = "/login.html"; return; }
  const json = await res.json();
  renderTable(json.data);
  renderPagination(json.current_page, json.last_page);
}
```

---

## 8. 3D Vehicle Display — concrete recommendation

The client asked me to *"find an API with good 3D models for cars… make car displays that look nice, full detailed interactable car pages."* Here's the honest landscape and the recommended build, based on current (2026) sources.

### 8.1 The reality
There is **no clean free API that returns a polished 3D car model keyed by make/model on demand.** What actually exists, and works well:

- **Google `<model-viewer>`** — a web component (not a model source) that renders interactive `.glb`/`.gltf` models with orbit, zoom, auto-rotate, and one-tap AR on mobile, on all evergreen browsers. It supports glTF and glb file formats and is compatible with all evergreen browsers; AR features require specific device and browser support. This is the **display layer** — recommended.
- **Sketchfab** — the model *source*. It hosts a library of over 1 million free models under Creative Commons licenses, available in glTF, GLB, and USDZ formats. Two integration paths: (a) **oEmbed/Viewer API** to embed Sketchfab's own player by model UID, or (b) **Download API** to pull GLB and self-host. Note the catch for downloads: downloading models requires end-users to be authenticated with a Sketchfab account — so for our use, an admin downloads suitable GLBs once and we self-host them.
- **NHTSA vPIC** — a free *data* (not 3D) API for decoding chassis/VIN into make/model/year. It is hosted by the U.S. NHTSA, available 24/7, free to use, and does not require registration. Useful to auto-fill the vehicle form; see §8.3.

### 8.2 Recommended approach (best effort/reward)
**Self-host a small library of GLB models + render with `<model-viewer>`.**

1. Curate ~6–12 GLB car models (sedan, SUV, coupe, hatchback, pickup, sports) from Sketchfab CC-licensed assets or modelviewer's samples. Store under `/frontend/assets/models/`.
2. Map each vehicle (or each category) to a GLB via the `model_3d_uid` column. A luxury sedan record points at `mercedes_cla.glb`, etc. (A true per-VIN 3D match isn't realistic — map by category/model family.)
3. Render:
```html
<script type="module"
  src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>

<model-viewer
  src="/assets/models/mercedes_cla.glb"
  poster="/assets/posters/mercedes_cla.webp"
  alt="Mercedes-Benz CLA250"
  camera-controls auto-rotate ar
  shadow-intensity="1" exposure="1.1"
  environment-image="neutral"
  style="width:100%;height:520px;background:transparent;">
</model-viewer>
```
- `camera-controls` = drag to orbit, scroll to zoom; `auto-rotate` = idle spin; `ar` = mobile AR button; `poster` = instant image while the GLB streams in. Adding a poster attribute means an image is shown until the model is ready to use.

**Optional alternative:** embed Sketchfab's hosted player directly (no self-hosting) using its oEmbed endpoint `https://sketchfab.com/oembed` with the model page URL — fastest to ship, but the look is Sketchfab-branded and you depend on their uptime.

### 8.3 Optional polish — auto-fill the vehicle form from chassis
On the "Add Vehicle" form, when an admin types a 17-char VIN-style chassis, call vPIC to pre-fill manufacturer/model/year (admin can still override):
```js
async function decodeChassis(vin){
  const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  const { Results } = await r.json();
  const get = k => Results.find(x => x.Variable === k)?.Value || "";
  return { make:get("Make"), model:get("Model"), year:get("Model Year") };
}
```
Caveats to tell the dev: vPIC is **US-market data, model years 1981+**, and is **slow** (often 2–3s per call) with informal rate limits (~10–15 req/s before throttling). Treat it as a nicety, not a dependency; never block form submission on it. It is completely free with no API key, but response times consistently exceed 2.5 seconds and aggressive querying can get an IP temporarily blocked.

---

## 9. Project Structure

```
magerwa-vtms/
├── backend/                       # Laravel
│   ├── app/
│   │   ├── Models/                # Admin.php, Client.php, Vehicle.php
│   │   └── Http/Controllers/      # Auth, Client, Vehicle, Record controllers
│   ├── routes/api.php             # all /api routes, grouped by auth:sanctum
│   ├── database/migrations/       # admins, clients, vehicles
│   ├── config/cors.php
│   └── .env                       # DB creds, APP_KEY (never committed)
│
└── frontend/
    ├── index.html                 # showroom / dashboard
    ├── login.html
    ├── records.html               # paginated table
    ├── vehicle.html               # 3D detail page
    ├── css/app.css                # glass + motion
    ├── js/api.js                  # fetch wrapper + auth
    ├── js/showroom.js
    └── assets/models/*.glb        # self-hosted 3D cars
```

---

## 10. Build Order (suggested sprints)

1. **Sprint 0 — setup:** Composer + Laravel, MySQL DB `magerwa_vtms` in phpMyAdmin, `.env`, install Sanctum, configure CORS.
2. **Sprint 1 — Task 1 (auth):** migrations for `admins`; register/login/logout/me; protect a test route; verify in Postman that no token = 401.
3. **Sprint 2 — Tasks 2 & 3 (CRUD):** `clients` + `vehicles` migrations, models, controllers, validation. Verify all CRUD via Postman.
4. **Sprint 3 — Task 4 (linkage + pagination):** link/unlink endpoints, unique plate enforcement, `/api/records` joined paginated view.
5. **Sprint 4 — frontend shell:** Bootstrap layout, glass system, login flow storing the token, records table consuming the API with working pagination.
6. **Sprint 5 — showroom + 3D:** hero `<model-viewer>`, category grid, trending cards, vehicle detail page with interactive model.
7. **Sprint 6 — polish & hardening:** scroll reveals, responsive passes (360/768/1280), security checklist sign-off, seed demo data.

---

## 11. Local Setup Instructions (for the dev)

**Backend**
```bash
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum
php artisan migrate          # after writing migrations
php artisan serve            # http://localhost:8000
```
- In phpMyAdmin: create database `magerwa_vtms` (utf8mb4). Put its name/user/pass in `.env`.
- `config/cors.php`: set `allowed_origins` to the frontend origin.

**Frontend**
- Serve the `frontend/` folder with any static server (VS Code Live Server, or `php -S localhost:5500`). Point `API` in `js/api.js` at `http://localhost:8000/api`.

**Postman (data entry path #2)**
1. `POST /api/auth/register` → create an admin.
2. `POST /api/auth/login` → copy the returned `token`.
3. Set header `Authorization: Bearer <token>` on a collection-level variable.
4. Hit the client/vehicle/link endpoints. Calling any of them without the token must return **401** — that's the acceptance test for Task 1.

**phpMyAdmin (data entry path #3)** — rows can be inserted directly; the `UNIQUE` constraints keep manual entry honest. Passwords inserted manually must still be hashed (use `php artisan tinker` → `Hash::make('...')`).

---

## 12. Acceptance Criteria (definition of done)

- [ ] **Task 1:** Admin can register with full name, email, phone, national ID; can log in; every non-auth API call without a valid token returns 401.
- [ ] **Task 2:** Admin can register/list/edit/delete clients (full name, NID, telephone, address).
- [ ] **Task 3:** Admin can register/list/edit/delete vehicles with all six fields (chassis, manufacture company, manufacturer, year, price, model name).
- [ ] **Task 4:** Admin can link a vehicle to a client and assign a **unique** plate number; records display in a **paginated** table; vehicles render in interactive 3D on the showroom and detail pages.
- [ ] **Tech:** Frontend is HTML/CSS/Bootstrap, responsive, with glassmorphism + fluid scrolling matching the reference; backend is Laravel + MySQL; data can be entered via frontend, Postman, or phpMyAdmin; full security checklist (§6) implemented.

---

### Appendix — quick reference links for the dev
- `<model-viewer>` docs & attributes: modelviewer.dev
- Sketchfab developer docs (Viewer API / Download API / oEmbed): sketchfab.com/developers
- NHTSA vPIC API: vpic.nhtsa.dot.gov/api
- Laravel Sanctum: laravel.com/docs (Sanctum section)
