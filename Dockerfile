# =========================
# 1) Build do FRONTEND
# =========================
FROM node:20-alpine AS web-build

WORKDIR /app/web

# Copia apenas arquivos necessários para o build
COPY web/package*.json ./
RUN npm install

COPY web/ .
RUN npm run build


# =========================
# 2) Build do BACKEND
# =========================
FROM node:20-alpine AS server-build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --production

COPY server/ .


# =========================
# 3) Imagem FINAL
# =========================
FROM node:20-alpine

WORKDIR /app

# Copia backend pronto
COPY --from=server-build /app/server ./server

# Copia frontend buildado (AQUI ESTÁ O PONTO CRÍTICO)
COPY --from=web-build /app/web/dist ./web/dist

# Variáveis
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start do servidor
CMD ["node", "server/index.js"]
