# SSL Sertifikası Kurulum Talimatları

HTTPS kurulumu tamamlandı! Şimdi sunucunuzda aşağıdaki adımları takip edin:

## Adım 1: Email Adresini Güncelle

`init-letsencrypt.sh` dosyasındaki email adresini kendi email adresinizle değiştirin:

```bash
email="5w1m.sitemanagement@gmail.com"  # Buraya kendi email adresinizi yazın
```

## Adım 2: Script'i Çalıştırılabilir Yap

```bash
chmod +x init-letsencrypt.sh
```

## Adım 3: SSL Sertifikası Oluştur

```bash
./init-letsencrypt.sh
```

Bu script:
- ✅ Gerekli dizinleri oluşturur
- ✅ Geçici (dummy) sertifikalar oluşturur
- ✅ Nginx'i başlatır
- ✅ Let's Encrypt'ten gerçek sertifika alır
- ✅ Nginx'i reload eder

## Adım 4: Kontrol Et

Sertifikaların başarıyla oluşturulduğunu kontrol edin:

```bash
docker-compose exec reverse-proxy ls -la /etc/letsencrypt/live/siteportal.com.tr/
docker-compose exec reverse-proxy ls -la /etc/letsencrypt/live/api.siteportal.com.tr/
```

## Adım 5: Test Et

Browser'da test edin:
- https://siteportal.com.tr
- https://api.siteportal.com.tr

HTTP'den HTTPS'e otomatik yönlendirme de çalışmalı:
- http://siteportal.com.tr → https://siteportal.com.tr

## Otomatik Yenileme

Certbot container'ı her 12 saatte bir sertifikaları kontrol eder ve gerekirse yeniler. Nginx de her 6 saatte bir reload edilir.

## Sorun Giderme

### DNS Hatası
Eğer DNS hatası alırsanız, domain'lerin sunucu IP'sini gösterdiğinden emin olun:
```bash
nslookup siteportal.com.tr
nslookup api.siteportal.com.tr
```

### Test Modu
İlk denemede test modunda çalıştırmak isterseniz, `init-letsencrypt.sh` içinde:
```bash
staging=1  # Test için 1, production için 0
```

### Rate Limiting
Let's Encrypt haftada 5 deneme hakkı verir. Test modunu kullanarak bu limiti aşmayın.
