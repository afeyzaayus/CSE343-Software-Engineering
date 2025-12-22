FROM node:20-bullseye

WORKDIR /app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Uygulama dosyalarını kopyala
COPY . .

# Prisma generate
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
