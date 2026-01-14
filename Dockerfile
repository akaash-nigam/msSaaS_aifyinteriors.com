# Cloud Run Optimized Dockerfile for AIfy Interiors
# Multi-stage build optimized for Google Cloud Run
# Features: Layer caching, security hardening, minimal image size, proper signal handling

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend + backend TypeScript)
RUN npm run build

# Stage 3: Production Runtime (Cloud Run Optimized)
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling (important for Cloud Run graceful shutdown)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy production node_modules from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Cloud Run sets PORT environment variable (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

# Health check endpoint (Cloud Run will use this for readiness/liveness probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose port (Cloud Run will override this with PORT env var)
EXPOSE 8080

# Use dumb-init to handle SIGTERM properly for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
