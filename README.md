# LinkEdu

A full-stack educational platform built with **Laravel 13** (backend) and **React + Vite** (frontend).

---

## Prerequisites

Before setting up the project, make sure you have the following installed:

- [PHP 8.3+](https://www.php.net/downloads)
- [Composer](https://getcomposer.org/download/)
- [Node.js 18+](https://nodejs.org/) (includes npm)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/AHMED-270/LinkEdu.git
cd LinkEdu
```

### 2. Set up the Backend (Laravel)

```bash
cd backend

# Install PHP dependencies (this creates the vendor/ directory)
composer install

# Create your environment file from the example
cp .env.example .env

# Generate the application key
php artisan key:generate

# Create the SQLite database and run migrations
touch database/database.sqlite
php artisan migrate
```

### 3. Set up the Frontend (React + Vite)

```bash
cd ../frontend

# Install Node.js dependencies (this creates the node_modules/ directory)
npm install
```

---

## Running the Project

### Start the Backend

```bash
cd backend
php artisan serve
```

The API will be available at **http://localhost:8000**.

### Start the Frontend

```bash
cd frontend
npm run dev
```

The app will be available in your browser at **http://localhost:5173**.

---

## Common Errors

### `Failed to open stream: No such file or directory` for `vendor/autoload.php`

This means you haven't installed the PHP dependencies yet. Run:

```bash
cd backend
composer install
```

### `npm error ENOENT: no such file or directory, open 'package.json'`

Make sure you are in the `frontend` directory before running npm commands:

```bash
cd frontend
npm install
```

---

## Project Structure

```
LinkEdu/
├── backend/    # Laravel 13 API
└── frontend/   # React + Vite application
```
