# =========================
# 1) BUILD FRONTEND
# =========================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY web/package.json web/package-lock.json* ./web/
RUN cd web && npm install

COPY web ./web
RUN cd web && npm run build

# =========================
# 2) BUILD BACKEND
# =========================
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY server ./server

# COPIA O BUILD DO FRONTEND
COPY --from=frontend /app/web/dist ./server/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/index.js"]
