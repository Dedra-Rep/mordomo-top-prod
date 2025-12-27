# ===== 1) Build stage (gera /dist) =====
FROM node:20-alpine AS build
WORKDIR /app

# Copia manifestos e instala deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copia o restante do projeto e builda
COPY . .
RUN npm run build

# ===== 2) Runtime stage (só o necessário) =====
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copia node_modules e o server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json

# Copia o dist gerado pelo Vite
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server/index.js"]
