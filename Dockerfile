# Multi-stage Dockerfile for NestJS Modular Monolith
# Optimized for layer caching and minimal production image size

# Build argument for application name
ARG NODE_VERSION=20-alpine
ARG APP_NAME=restAPI

# ============================================
# Stage 1: Base - Common base image
# ============================================
FROM node:${NODE_VERSION} AS base

# Set working directory
WORKDIR /app

# Install system dependencies if needed
RUN apk add --no-cache \
    dumb-init

# ============================================
# Stage 2: Dependencies - Install all dependencies
# ============================================
FROM base AS dependencies

# Copy package files first for better layer caching
# This layer will only rebuild if package files change
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --quiet

# ============================================
# Stage 3: Builder - Compile TypeScript
# ============================================
FROM dependencies AS builder

# Copy TypeScript configuration
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY src ./src

# Build the application using NestJS CLI
RUN npx nest build

# ============================================
# Stage 4: Production - Minimal runtime image
# ============================================
FROM base AS production

# Re-declare APP_NAME for this stage
ARG APP_NAME=restAPI
ENV APP_NAME=${APP_NAME}

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --quiet --omit=dev && \
    npm cache clean --force

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership of application files
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose application port (default NestJS port)
EXPOSE 3000

# Use dumb-init to handle signals properly and run the compiled app
# Using shell form to allow environment variable expansion
CMD dumb-init node dist/apps/$APP_NAME/main.js
