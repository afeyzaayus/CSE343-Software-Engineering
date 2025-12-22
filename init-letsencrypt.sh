#!/bin/bash

# SSL Sertifikası Kurulum Scripti
# Bu script Let's Encrypt ile SSL sertifikası oluşturur

domains=(siteportal.com.tr api.siteportal.com.tr)
rsa_key_size=4096
data_path="./certbot"
email="5w1m.sitemanagement@gmail.com" # Email adresinizi buraya yazın
staging=0 # Test için 1, production için 0

if [ -d "$data_path" ]; then
  read -p "Mevcut sertifika verileri bulundu. Devam etmek sertifikaları silecek. Devam edilsin mi? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# Certbot dizinlerini oluştur
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### SSL parametreleri indiriliyor..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

# Her domain için dummy sertifika oluştur
for domain in "${domains[@]}"; do
  echo "### $domain için dummy sertifika oluşturuluyor..."
  path="/etc/letsencrypt/live/$domain"
  mkdir -p "$data_path/conf/live/$domain"
  docker-compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
      -keyout '$path/privkey.pem' \
      -out '$path/fullchain.pem' \
      -subj '/CN=localhost'" certbot
  echo
done

# Nginx'i başlat
echo "### Nginx başlatılıyor..."
docker-compose up --force-recreate -d reverse-proxy
echo

# Dummy sertifikaları sil
for domain in "${domains[@]}"; do
  echo "### $domain için dummy sertifika siliniyor..."
  docker-compose run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/$domain && \
    rm -Rf /etc/letsencrypt/archive/$domain && \
    rm -Rf /etc/letsencrypt/renewal/$domain.conf" certbot
  echo
done

# Her domain için gerçek sertifika al
for domain in "${domains[@]}"; do
  echo "### $domain için Let's Encrypt sertifikası isteniyor..."
  
  # Staging veya production
  if [ $staging != "0" ]; then staging_arg="--staging"; fi
  
  docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      $staging_arg \
      --email $email \
      -d $domain \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --force-renewal" certbot
  echo
done

# Nginx'i reload et
echo "### Nginx reload ediliyor..."
docker-compose exec reverse-proxy nginx -s reload

echo "### Kurulum tamamlandı!"
