FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install all deps (including dev for build)
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build client + server (NODE_OPTIONS guards against esbuild OOM on low-memory hosts)
RUN NODE_OPTIONS=--max-old-space-size=2048 npm run build

# ------- Production stage -------
FROM node:20-slim

WORKDIR /app

# Install only production dependencies + better-sqlite3 (needs build tools)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seed_words.json ./seed_words.json
RUN mkdir -p /data

# SQLite database will be stored on a persistent Fly volume
# mounted at /data
ENV DATABASE_PATH=/data/deve.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
