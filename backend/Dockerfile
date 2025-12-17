# Temel imaj olarak Node.js kullan
FROM node:18

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Tüm dosyaları konteynıra kopyala
COPY . .

# Uygulamayı başlat
CMD ["npm", "run", "dev"]

# 5000 portunu aç
EXPOSE 5000