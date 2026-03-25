# LinkEdu

A full-stack educational platform with a **Laravel** (PHP) backend and a **React + Vite** frontend.

---

## Prerequisites

- **PHP** 8.3+
- **Composer** ([install](https://getcomposer.org/download/))
- **Node.js** 20+ and **npm** ([install](https://nodejs.org/))

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/AHMED-270/LinkEdu.git
cd LinkEdu
```

### 2. Backend (Laravel)

```bash
cd backend

# Install PHP dependencies (creates the vendor/ directory)
composer install

# Create the environment configuration file
cp .env.example .env

# Generate the application key
php artisan key:generate

# Create the SQLite database file
touch database/database.sqlite

# Run database migrations
php artisan migrate

# Start the development server
php artisan serve
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend (React + Vite)

Open a new terminal:

```bash
cd frontend

# Install Node.js dependencies (creates the node_modules/ directory)
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Common Errors

### `Failed to open stream: vendor/autoload.php`

This error means PHP dependencies have not been installed yet.  
Run `composer install` inside the `backend/` directory.

### `npm error code ENOENT` / `package.json not found`

Make sure you are running `npm install` from inside the `frontend/` directory, not the project root.

---

## Running Tests

### Backend

```bash
cd backend
php artisan test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

---

## Project Structure

```
LinkEdu/
├── backend/    # Laravel API (PHP)
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── composer.json   # PHP dependency manifest
│   └── .env.example    # Environment template
└── frontend/   # React + Vite SPA
    ├── src/
    ├── public/
    └── package.json    # Node.js dependency manifest
```
