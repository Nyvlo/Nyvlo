# Build Stage
FROM node:18-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 and other native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:18-slim

WORKDIR /app

# Install runtime dependencies for sharp and better-sqlite3
RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config

# Create data and logs directories
RUN mkdir -p data logs uploads backups

# Expose backend port
EXPOSE 4000

CMD ["node", "dist/index.js"]
