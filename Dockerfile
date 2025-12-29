# ===============================
# STAGE 1 — BUILD FRONTEND (VITE)
# ===============================
FROM node:20-alpine AS web-build

WORKDIR /app/web

COPY web/package.json web/package-lock.json* ./
RUN npm install

COPY web/ .
RUN npm run build


# ===============================
# STAGE 2 — BACKEND + STATIC
# ===============================
FROM node:20-alpine

WORKDIR /app

# Backend deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Backend source
COPY server ./server

# Frontend build
COPY --from=web-build /app/web/dist ./web/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/index.js"]
