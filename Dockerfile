# =========================
# 1) Build do frontend (Vite)
# =========================
FROM node:20-alpine AS web-build
WORKDIR /app

# Copia apenas manifestos primeiro (cache)
COPY web/package*.json ./web/
# Se você tiver pnpm/yarn, ajuste aqui. Mantendo npm por padrão.
RUN cd web && npm ci

# Copia o restante do frontend e builda
COPY web ./web
RUN cd web && npm run build


# =========================
# 2) Build/instalação do backend
# =========================
FROM node:20-alpine AS server-build
WORKDIR /app

# Copia manifestos do root (se existir) para cache
# Se o seu backend NÃO usa o package.json do root, ainda assim isso não quebra.
COPY package*.json ./
RUN if [ -f package-lock.json ] || [ -f package.json ]; then npm ci --omit=dev || npm ci || true; fi

# Copia backend
COPY server ./server

# Copia dist do frontend gerado
COPY --from=web-build /app/web/dist ./web/dist

# =========================
# 3) Runtime final (enxuto)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas o necessário
COPY --from=server-build /app/package*.json ./
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/server ./server
COPY --from=server-build /app/web/dist ./web/dist

# Cloud Run usa $PORT
EXPOSE 8080
ENV PORT=8080

# Start
CMD ["node", "server/index.js"]
