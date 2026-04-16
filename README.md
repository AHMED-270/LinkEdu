# LinkEdu

## 🚀 Current Production Setup

- **Frontend:** Deployed on [Vercel](https://link-edu.vercel.app)
- **Backend:** Deployed on [Laravel Cloud](https://backendlinkededu-main-oied8k.free.laravel.cloud)

See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for configuration and troubleshooting.

---

## Deploy On Render (Ready)

This repository now includes [render.yaml](render.yaml) for one-click Blueprint deploy:

- [backend](backend) as a PHP web service
- [frontend](frontend) as a static site
- Render Postgres database

### 1) Push main branch

Render will deploy from your `main` branch.

### 2) Deploy with Blueprint

1. Open Render Dashboard.
2. Click `New` -> `Blueprint`.
3. Select this repository.
4. Keep [render.yaml](render.yaml) as detected and deploy.

### 3) Important after creation

If Render gives different generated URLs than the defaults in [render.yaml](render.yaml):

1. In service `linkedu-backend`, set env vars:
	- `APP_URL=https://<your-backend-url>`
	- `FRONTEND_URL=https://<your-frontend-url>`
	- `SANCTUM_STATEFUL_DOMAINS=<your-frontend-host-only>`
2. In service `linkedu-frontend`, set:
	- `VITE_API_URL=https://<your-backend-url>`
3. Redeploy both services.

### 4) Default production behavior

- Laravel migrations run automatically on deploy via `preDeployCommand`.
- Frontend uses SPA rewrite to `index.html`.
- CORS allows local development and `*.onrender.com` domains.

## Deploy On Railway (Docker)

This repository now includes Docker support for both services:

- [backend/Dockerfile](backend/Dockerfile)
- [backend/railway.toml](backend/railway.toml)
- [frontend/Dockerfile](frontend/Dockerfile)
- [frontend/railway.toml](frontend/railway.toml)

### 1) Create two Railway services from same repository

1. `linkedu-backend`
	- Root directory: `backend`
	- Builder: `Dockerfile`
2. `linkedu-frontend`
	- Root directory: `frontend`
	- Builder: `Dockerfile`

### 2) Required Railway environment variables

Backend service (`linkedu-backend`):

- `APP_NAME=LinkEdu`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generate with: php artisan key:generate --show>`
- `APP_URL=https://<your-backend-domain>.up.railway.app`
- `FRONTEND_URL=https://<your-frontend-domain>.up.railway.app`
- `LOG_CHANNEL=stderr`
- `LOG_LEVEL=info`
- `DB_CONNECTION=pgsql`
- `DB_URL=<Railway Postgres connection string>`
- `CACHE_STORE=database`
- `SESSION_DRIVER=database`
- `QUEUE_CONNECTION=sync`
- `SANCTUM_STATEFUL_DOMAINS=<your-frontend-domain>.up.railway.app`
- Optional: `RUN_MIGRATIONS=true`

Frontend service (`linkedu-frontend`):

- `VITE_API_URL=https://<your-backend-domain>.up.railway.app`

### 3) Runtime behavior

- Backend container waits briefly for database, runs migrations (if enabled), then starts on Railway `PORT`.
- Frontend container builds with Vite and serves the static app on Railway `PORT`.

### 4) If Railway shows `composer: not found`

This means Railway is not building that service with the Dockerfile you expect.

Use these exact settings per service:

1. Backend service:
	- Root directory: `backend`
	- Builder: `Dockerfile`
	- Dockerfile path: `Dockerfile`
	- Build command in Railway UI: leave empty
2. Frontend service:
	- Root directory: `frontend`
	- Builder: `Dockerfile`
	- Dockerfile path: `Dockerfile`
	- Build command in Railway UI: leave empty

Then click `Redeploy` for both services.

The repository now includes per-service `railway.toml` files to force Docker builds when each service root directory is set correctly.

If you keep root directory as repository root instead, set Dockerfile path explicitly:

- Backend: `backend/Dockerfile`
- Frontend: `frontend/Dockerfile`

## Deploy On Laravel Cloud + Vercel (SQLite)

Use this setup if you want backend on Laravel Cloud and frontend on Vercel without PostgreSQL.

### 1) Backend (Laravel Cloud)

1. Deploy [backend](backend) as your Laravel Cloud application.
2. Set environment variables using [backend/.env.laravel-cloud.example](backend/.env.laravel-cloud.example):
	- `DB_CONNECTION=sqlite`
	- `DB_DATABASE=/var/www/html/database/database.sqlite`
	- `FRONTEND_URL=https://<your-vercel-domain>.vercel.app`
	- `SANCTUM_STATEFUL_DOMAINS=<your-vercel-domain>.vercel.app`
	- `SESSION_SECURE_COOKIE=true`
	- `SESSION_SAME_SITE=none`
3. Generate and set `APP_KEY`.
4. Run migrations after first deploy.

### 2) Frontend (Vercel)

1. Deploy [frontend](frontend) as a Vercel project.
2. Set root directory to `frontend`.
3. Add `VITE_API_URL=https://<your-laravel-cloud-domain>` in Vercel environment variables.
4. Ensure SPA routing rewrite exists via [frontend/vercel.json](frontend/vercel.json).

### 3) Included project files for this setup

- [backend/.env.laravel-cloud.example](backend/.env.laravel-cloud.example)
- [frontend/.env.production.example](frontend/.env.production.example)
- [frontend/vercel.json](frontend/vercel.json)

    