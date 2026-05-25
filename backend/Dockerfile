FROM php:8.2-apache

# Install system dependencies and PostgreSQL support
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/web

# Copy backend files
COPY . .

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Configure Apache
RUN sed -i 's|/var/www/html|/var/web/public|g' /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

EXPOSE 80
CMD ["apache2-foreground"]