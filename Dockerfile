# ============================================
# Estágio 1: Base com Node.js
# ============================================
FROM node:18-alpine AS base
WORKDIR /app

# ============================================
# Estágio 2: Desenvolvimento (com hot reload)
# ============================================
FROM base AS development

# Copia os arquivos de dependência
COPY package.json package-lock.json ./

# Instala todas as dependências (incluindo devDependencies)
RUN npm ci --legacy-peer-deps

# Copia o restante do código fonte
COPY . .

# Expõe a porta do Next.js
EXPOSE 3000

# Comando para desenvolvimento com hot reload
CMD ["npm", "run", "dev"]

# ============================================
# Estágio 3: Build (produção)
# ============================================
FROM base AS builder

# Copia dependências do estágio anterior
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia o código fonte
COPY . .

# Gera o build de produção
RUN npm run build

# ============================================
# Estágio 4: Produção (otimizado)
# ============================================
FROM base AS production

# Copia apenas o necessário para produção
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules


EXPOSE 3000
CMD ["npm", "start"]