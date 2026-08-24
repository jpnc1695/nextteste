# ============================================
# Estágio 1: Base com Node.js 20 (slim para compatibilidade)
# ============================================
FROM node:20-slim AS base   
WORKDIR /app

# ============================================
# Estágio 2: Desenvolvimento (com hot reload)
# ============================================
FROM base AS development

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ============================================
# Estágio 3: Build (produção)
# ============================================
FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ============================================
# Estágio 4: Produção (otimizado)
# ============================================
FROM base AS production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
# Se você NÃO tem o arquivo next.config.js, remova ou comente a linha abaixo:
# COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]