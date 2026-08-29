# ─────────────────────────────────────────────────────────────────
# Stage 1: Build
# Installs dependencies and compiles server.ts → dist/server.cjs
# ─────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build)
RUN npm ci

# Copy source files needed for build
COPY server.ts ./
COPY tsconfig*.json ./
COPY src/ ./src/
COPY vite.config.* ./
COPY index.html ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Build: compiles React SPA + bundles server.ts → dist/server.cjs
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production runtime
# Only keeps what's needed to run the server
# ─────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Chromium for Puppeteer (PDF export feature)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run will set PORT env var; default to 3000 for local testing
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the compiled Express server
CMD ["node", "dist/server.cjs"]
