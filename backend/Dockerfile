# Node 20 tabanlı imaj
FROM node:20-bullseye

# OpenSSL 1.1 kurulumu (gerekiyorsa)
RUN apt-get update && \
    apt-get install -y wget gnupg2 ca-certificates && \
    wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.1/libssl1.1_1.1.1f-1ubuntu2.17_amd64.deb && \
    dpkg -i libssl1.1_1.1.1f-1ubuntu2.17_amd64.deb || apt-get -f install -y

# Çalışma dizini
WORKDIR /app

# Package.json ve package-lock.json kopyala ve npm install
COPY package*.json ./
RUN npm install

# Prisma client oluştur
RUN npx prisma generate

# Tüm uygulama dosyalarını kopyala
COPY . .

# Port ve start
EXPOSE 3000
CMD ["npm", "start"]
