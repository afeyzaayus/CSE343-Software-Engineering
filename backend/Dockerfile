# Mevcut node imajını kullanıyorsan
FROM node:20-bullseye

# OpenSSL 1.1 kurulumu
RUN apt-get update && \
    apt-get install -y wget gnupg2 ca-certificates && \
    wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.1/libssl1.1_1.1.1f-1ubuntu2.17_amd64.deb && \
    dpkg -i libssl1.1_1.1.1f-1ubuntu2.17_amd64.deb || apt-get -f install -y

# Uygulama kopyalama
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]