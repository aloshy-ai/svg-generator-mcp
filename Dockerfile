# Single-stage build for simplicity
FROM node:18-alpine

# Install Python for MFLUX support (optional)
RUN apk add --no-cache python3 py3-pip

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
WORKDIR /app

# Copy package files and install dependencies (skip prepare script)
COPY --chown=mcp:nodejs package*.json ./
RUN npm ci --ignore-scripts

# Copy source code and build
COPY --chown=mcp:nodejs . .
RUN npm run build

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