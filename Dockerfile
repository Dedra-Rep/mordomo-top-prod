FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm install

# Código
COPY . .

# Build do frontend
RUN npm run build

# Cloud Run
EXPOSE 8080
CMD ["npm","start"]
