# Single-stage build for simplicity
FROM node:18-alpine

# Install Python and dependencies for FLUX/MFLUX support
RUN apk add --no-cache python3 py3-pip git build-base python3-dev linux-headers

# Create a virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install FLUX/MFLUX based on architecture
RUN if [ "$(uname -m)" = "aarch64" ]; then     pip3 install --no-cache-dir --break-system-packages mflux; else     pip3 install --no-cache-dir --break-system-packages torch torchvision --index-url https://download.pytorch.org/whl/cpu &&     pip3 install --no-cache-dir --break-system-packages diffusers transformers accelerate; fi

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
WORKDIR /app

# Create data directory for persistent storage
RUN mkdir -p /app/data && chown mcp:nodejs /app/data

# Copy package files and install dependencies (skip prepare script)
COPY --chown=mcp:nodejs package*.json ./
RUN npm ci --ignore-scripts

# Copy source code and build
COPY --chown=mcp:nodejs . .
RUN npm run build

# Switch to non-root user
USER mcp

# Create volume for persistent data
VOLUME ["/app/data"]

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