FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Prisma client'ı üret
RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/app.js"]