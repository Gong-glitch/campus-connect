FROM php:8.3-apache

# Install system dependencies and required PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libzip-dev \
    libxml2-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql gd zip xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/web

# Copy backend files
COPY . .

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Configure Apache with Explicit Global Directory Access Permissions
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/web/public\n\
    <Directory "/var/web/public">\n\
        Options Indexes FollowSymLinks MultiViews\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# Enable Apache rewrite module
RUN a2enmod rewrite

# 🟢 FIX: Grant read/write permissions to Apache for Laravel storage and cache directories
RUN chown -R www-data:www-data /var/web/storage /var/web/bootstrap/cache \
    && chmod -R 775 /var/web/storage /var/web/bootstrap/cache

EXPOSE 80
CMD php artisan config:clear && php artisan migrate --force && apache2-foreground