#!/bin/bash

# SSL Sertifikası Kurulum Scripti (Düzeltilmiş Versiyon)
# Bu script Let's Encrypt ile SSL sertifikası oluşturur

domains=(siteportal.com.tr api.siteportal.com.tr)
rsa_key_size=4096
data_path="./certbot"
email="5w1m.sitemanagement@gmail.com"
staging=0 # Test için 1, production için 0

echo "### Adım 1: SSL parametreleri indiriliyor..."
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi
echo

echo "### Adım 2: Geçici HTTP-only nginx yapılandırması ile başlatılıyor..."
# Geçici olarak HTTP-only config kullan
cp nginx.conf nginx.conf.backup
cp nginx-http-only.conf nginx.conf

# Container'ları durdur
docker-compose down

# Sadece gerekli servisleri başlat
docker-compose up -d backend frontend reverse-proxy
echo "Nginx'in başlaması bekleniyor..."
sleep 5
echo

# Nginx'in çalıştığını kontrol et
if ! docker-compose ps | grep -q "reverse-proxy.*Up"; then
    echo "HATA: Nginx başlatılamadı!"
    docker-compose logs reverse-proxy
    exit 1
fi

echo "### Adım 3: Let's Encrypt sertifikaları alınıyor..."

# Her domain için sertifika al
for domain in "${domains[@]}"; do
  echo "### $domain için sertifika isteniyor..."
  
  # Staging veya production
  if [ $staging != "0" ]; then staging_arg="--staging"; fi
  
  docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      $staging_arg \
      --email $email \
      -d $domain \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --non-interactive \
      --force-renewal" certbot
  
  if [ $? -ne 0 ]; then
    echo "HATA: $domain için sertifika alınamadı!"
    echo "Orijinal nginx.conf geri yükleniyor..."
    mv nginx.conf.backup nginx.conf
    exit 1
  fi
  echo
done

echo "### Adım 4: HTTPS yapılandırması aktif ediliyor..."
# Orijinal (HTTPS'li) config'i geri yükle
mv nginx.conf.backup nginx.conf

# Nginx'i reload et
docker-compose exec reverse-proxy nginx -s reload

if [ $? -ne 0 ]; then
    echo "Nginx reload başarısız, yeniden başlatılıyor..."
    docker-compose restart reverse-proxy
fi

echo
echo "### Adım 5: Certbot otomatik yenileme servisi başlatılıyor..."
docker-compose up -d certbot

echo
echo "✅ Kurulum tamamlandı!"
echo
echo "Test edin:"
echo "  https://siteportal.com.tr"
echo "  https://api.siteportal.com.tr"
