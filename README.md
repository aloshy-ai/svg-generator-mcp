# SVG Generator MCP Server

[![CI/CD Pipeline](https://github.com/aloshy-ai/svg-generator-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/aloshy-ai/svg-generator-mcp/actions/workflows/ci.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/aloshy-ai/svg-generator-mcp/pkgs/container/svg-generator-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

AI-powered MCP server for generating high-quality SVG illustrations using FLUX/MFLUX with multi-platform support.

## Quick Start

### 🚀 Two-Step Setup

**Step 1: Download and test the server (required)**
```bash
# This will download the Docker image (~500MB) and test the server
docker run --rm ghcr.io/aloshy-ai/svg-generator-mcp:latest
```
> ⚠️ **Important**: You must run this first! Without it, your MCP client will hang for 2-3 minutes during the initial Docker download. Press `Ctrl+C` to stop the server once you see it's working.

**Verify the server is ready:**
```bash
# Check that the Docker image is now cached locally
docker images | grep svg-generator

# Expected output: You should see the image listed
# ghcr.io/aloshy-ai/svg-generator-mcp   latest   ...
```

**Step 2: Add to your MCP client configuration (example for Claude Desktop):**
```json
{
  "mcpServers": {
    "svg-generator": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/aloshy-ai/svg-generator-mcp:latest"]
    }
  }
}
```
**That's it!** The server starts instantly when your MCP client connects (since the Docker image is already cached).

> 👀 **Monitor Progress** (if needed): Watch the startup process with:
> ```bash
> # Watch for running containers
> docker ps | grep svg-generator
> 
> # View server logs once container starts
> docker logs <container-id>
> ```

## Prerequisites
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **MCP Client** - Any Model Context Protocol compatible client

## Available Tools

### Core Tools
- **`generate_svg_illustration`** - Generate SVG illustrations from text prompts
- **`optimize_svg`** - Optimize SVG files for smaller size and better performance
- **`list_available_models`** - List AI models and their status
- **`get_generation_history`** - Get recent generation history

### Example Usage
Generate a vector illustration:
```json
{
  "prompt": "A minimalist mountain landscape with geometric trees",
  "style": "vector",
  "width": 1024,
  "height": 512
}
```

## Configuration Options

### Parameters for `generate_svg_illustration`
- **`prompt`** (required): Description of the desired illustration
- **`style`** (optional): "vector", "laser", or "colorful" (default: "vector")
- **`width`/`height`** (optional): Size in pixels, 64-2048 (default: 512)
- **`steps`** (optional): Quality steps, 1-50 (default: 20)
- **`guidance_scale`** (optional): AI guidance, 1-20 (default: 7.5)
- **`seed`** (optional): Random seed for reproducible results

## Development

### Getting Started
For contributors who want to modify the server:

```bash
git clone https://github.com/aloshy-ai/svg-generator-mcp.git
cd svg-generator-mcp
npm install
npm test
npm run dev
```

### 🔄 CI/CD Pipeline

Automated GitHub Actions pipeline ensures code quality and seamless deployment:

- ✅ **Automated Testing** - Full test suite on every push and PR
- 🐳 **Docker Publishing** - Multi-platform images published to [GitHub Container Registry](https://github.com/aloshy-ai/svg-generator-mcp/pkgs/container/svg-generator-mcp)
- 🏗️ **Multi-Platform Support** - Native AMD64 and ARM64 builds
- 🔒 **Security Scanning** - Vulnerability scanning with npm audit
- 📦 **Automated Releases** - Tagged releases trigger production builds

All Docker images are available at: `ghcr.io/aloshy-ai/svg-generator-mcp:latest`

## 🧠 How It Works
1. **🎨 Style Analysis** - Prompt analyzed for desired visual style and composition
2. **⚡ AI Generation** - FLUX/MFLUX with optimized backends creates high-quality images
3. **🔧 SVG Conversion** - Images converted to optimized SVG format
4. **📄 Delivery** - Clean SVG delivered via MCP protocol to your client

## 🛠️ Tech Stack
- **Backend**: TypeScript with clean service layer architecture
- **AI Models**: FLUX/MFLUX with architecture-optimized backends (MFLUX for Apple Silicon, FLUX for Intel/AMD)
- **Processing**: Sharp for image optimization and SVG conversion
- **Protocol**: Model Context Protocol (MCP) with stdio transport
- **Deployment**: Docker with multi-platform support
- **CI/CD**: GitHub Actions with automated testing and publishing

## 🔧 Troubleshooting

### Common Issues

#### MCP Connection Issues
- **Long startup time**: First run takes 2-3 minutes for Docker image download and initialization
  - Monitor with: `docker pull ghcr.io/aloshy-ai/svg-generator-mcp:latest`
- **Server not starting**: Check Docker is running and image is available
  - Check containers: `docker ps -a | grep svg-generator`
  - View logs: `docker logs <container-id>`
- **Tool not appearing**: Verify MCP client configuration syntax
- **Generation failures**: Server runs in demo mode without MFLUX - check logs

#### Docker Issues  
- **Platform compatibility**: Multi-platform images support both AMD64 and ARM64
- **Container startup failures**: Check logs with `docker logs <container-id>`
- **Permission errors**: Ensure Docker daemon is running and accessible

### Getting Help
- 📋 Check [Issues](https://github.com/aloshy-ai/svg-generator-mcp/issues) for common problems
- 🐛 [Report a bug](https://github.com/aloshy-ai/svg-generator-mcp/issues/new) if you find one
- 💡 [Request a feature](https://github.com/aloshy-ai/svg-generator-mcp/issues/new) for enhancements

## License
MIT

```
▄▀█ █░░ █▀█ █▀ █░█ █▄█ ░ ▄▀█ █
█▀█ █▄▄ █▄█ ▄█ █▀█ ░█░ ▄ █▀█ █
```