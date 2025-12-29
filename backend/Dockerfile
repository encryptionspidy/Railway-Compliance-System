FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Note: We intentionally use Debian Bullseye (OpenSSL 1.1) for Prisma engine compatibility
# without requiring package installation during docker build.

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-bullseye-slim AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
