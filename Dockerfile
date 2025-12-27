# ===== 1) Build stage (gera /dist) =====
FROM node:20-alpine AS build
WORKDIR /app

# IMPORTANTE: forçar instalação com devDependencies (vite/typescript)
ENV NODE_ENV=development

COPY package.json package-lock.json* ./
RUN npm ci --include=dev || npm install --include=dev

COPY . .
RUN npm run build

# ===== 2) Runtime stage (só o necessário) =====
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server/index.js"]
