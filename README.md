# LinkEdu

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

    