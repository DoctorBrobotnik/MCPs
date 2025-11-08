# Builder stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build

# Production stage
FROM node:20-slim AS production
RUN useradd -u 9003 -m mcpuser
USER mcpuser
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
