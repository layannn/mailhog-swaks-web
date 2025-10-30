FROM node:18-bullseye-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends swaks ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

