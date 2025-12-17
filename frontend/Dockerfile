# Nginx'in son sürümünü kullan
FROM nginx:alpine

# Özel nginx konfigürasyonunu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Public klasörünü nginx'in kök dizinine kopyala
COPY public/ /usr/share/nginx/html/