# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

# Create non-root user
RUN useradd -m -s /bin/bash mcpuser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built JavaScript from builder
COPY --from=builder /app/build ./build

# Set environment variable for unbuffered output
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Switch to non-root user
USER mcpuser

# Run the server
CMD ["node", "build/index.js"]
