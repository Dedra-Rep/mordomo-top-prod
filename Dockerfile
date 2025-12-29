# ---------- build web ----------
FROM node:20-alpine AS webbuild
WORKDIR /app

# Root deps (server deps)
COPY package.json ./
RUN npm install --omit=dev

# Web deps + build
COPY web/package.json web/package-lock.json* ./web/
RUN cd web && npm install

COPY web ./web
RUN cd web && npm run build

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Server deps
COPY package.json ./
RUN npm install --omit=dev

# App code
COPY server ./server
COPY --from=webbuild /app/web/dist ./web/dist

EXPOSE 8080
CMD ["node", "server/index.js"]
