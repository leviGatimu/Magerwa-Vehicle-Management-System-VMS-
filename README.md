# Magerwa VTMS

Vehicle Tracking Management System — Laravel 12 REST API + MySQL, with a **dark dealership UI** (Blade views + vanilla JS + interactive 3D `<model-viewer>`) served by the **same** Laravel app.

## Run (one command serves API + frontend)

**1. MySQL** (XAMPP): start MySQL — DB `magerwa_vtms` is already created.

**2. App** (API + frontend, port 8001):
```bash
cd backend
php artisan migrate:fresh --seed   # only to reset demo data
php artisan serve --host=127.0.0.1 --port=8001
```

Open **http://127.0.0.1:8001/login** — demo admin: `admin@magerwa.rw` / `password123`

## Pages (Blade, served by artisan)
- `/login` — sign in / register
- `/` — showroom (hero 3D, search, stats, latest cars, categories)
- `/records` — paginated, searchable, filterable vehicle table
- `/clients` — client CRUD
- `/vehicle?id=N` — full interactive 3D detail + spec sheet + owner

## Structure
- `backend/resources/views/*.blade.php` — frontend pages
- `backend/public/{css,js,assets}` — styles, vanilla JS API client, self-hosted GLB models
- `backend/routes/{api,web}.php` — API + page routes
- API base in `public/js/api.js` is `/api` (same origin — no CORS needed in dev)

## Security (implemented)
- Sanctum bearer tokens; every non-auth API route returns **401** without a valid token
- Server-side validation; 16-digit NID regex; unique chassis + plate (DB + validation)
- Login throttled `5/min`; passwords bcrypt-hashed & hidden; `$fillable` allow-lists; XSS-escaped output

## 3D models
Self-hosted in `public/assets/models/` (`car.glb` = Khronos ToyCar; category files are copies — drop in real per-category GLBs to replace).
