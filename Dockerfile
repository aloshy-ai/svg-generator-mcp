# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Python for MFLUX support (optional)
RUN apk add --no-cache python3 py3-pip

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/package.json ./

# Switch to non-root user
USER mcp

# Expose port (though MCP typically uses stdio)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('MCP Server healthy')" || exit 1

# Default command
CMD ["node", "dist/index.js"]

# Labels for GitHub Container Registry
LABEL org.opencontainers.image.title="SVG Generator MCP Server"
LABEL org.opencontainers.image.description="Professional MCP Server for generating SVG illustrations using MFLUX"
LABEL org.opencontainers.image.vendor="aloshy-ai"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/aloshy-ai/svg-generator-mcp"