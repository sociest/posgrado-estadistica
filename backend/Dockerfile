FROM serversideup/php:8.5-fpm-nginx

WORKDIR /var/www/html

# Copiar el proyecto completo permite ejecutar los scripts de Composer
# (incluido package:discover) durante la construcción de la imagen.
COPY --chown=www-data:www-data . /var/www/html

# Laravel acepta archivos de hasta 20 MB; PHP debe permitir el request completo.
RUN printf 'file_uploads=On\nupload_max_filesize=25M\npost_max_size=26M\nmax_file_uploads=20\n' \
    > /usr/local/etc/php/conf.d/uploads.ini

USER www-data
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

RUN php artisan storage:link

EXPOSE 8080
