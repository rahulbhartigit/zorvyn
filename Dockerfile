# 1. Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first to leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript project
RUN npx tsc

# 2. Production Stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client for the production environment
RUN npx prisma generate

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

# Set non-root user for security
USER node

# Expose standard application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
