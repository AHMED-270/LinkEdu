FROM php:8.3-cli-alpine

# System dependencies and PHP extensions required by Laravel + PostgreSQL
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    postgresql-dev \
    && docker-php-ext-install pdo_pgsql mbstring bcmath intl zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application source
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV PORT=10000

EXPOSE 10000

# Run migrations at container start, ensure storage symlink, then launch app.
CMD ["sh", "-lc", "php artisan migrate --force && php artisan storage:link || true; php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
