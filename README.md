# SVG Generator MCP Server

[![CI/CD Pipeline](https://github.com/aloshy-ai/svg-generator-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/aloshy-ai/svg-generator-mcp/actions/workflows/ci.yml)
[![PyPI Version](https://img.shields.io/pypi/v/svg-generator-mcp?logo=pypi)](https://pypi.org/project/svg-generator-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

AI-powered MCP server for generating high-quality SVG illustrations using FLUX/MFLUX with automatic dependency management.

## Quick Start

### 🚀 One-Command Setup

**Install and configure with uvx (recommended):**
```bash
# Install using uvx (automatically handles all dependencies)
uvx svg-generator-mcp
```

**Add to your MCP client configuration (example for Claude Desktop):**
```json
{
  "mcpServers": {
    "svg-generator": {
      "command": "uvx",
      "args": ["svg-generator-mcp"]
    }
  }
}
```

**That's it!** The server starts instantly with automatic dependency management.

### 🐍 Alternative: Direct Python Installation

```bash
# Install from PyPI
pip install svg-generator-mcp

# Run directly
svg-generator-mcp
```

**Claude Desktop configuration for pip install:**
```json
{
  "mcpServers": {
    "svg-generator": {
      "command": "svg-generator-mcp"
    }
  }
}
```

## Prerequisites
- **Python 3.8+** - [Install Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/) (for AI processing)
- **MCP Client** - Any Model Context Protocol compatible client

> 💡 **uvx automatically manages dependencies** - Node.js deps are installed on first run

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
- 🐍 **PyPI Publishing** - Python packages published to [PyPI](https://pypi.org/project/svg-generator-mcp/)
- 🏗️ **Cross-Platform Support** - Works on macOS, Linux, and Windows
- 🔒 **Security Scanning** - Vulnerability scanning with npm audit
- 📦 **Automated Releases** - Tagged releases trigger production builds

Install the development version: `pip install svg-generator-mcp`

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
- **Deployment**: Python packaging with uvx for automatic dependency management
- **CI/CD**: GitHub Actions with PyPI publishing and automated testing

## 🔧 Troubleshooting

### Common Issues

#### Installation Issues
- **uvx not found**: Install with `pip install pipx && pipx install uv`
- **Python version**: Requires Python 3.8+. Check with `python --version`
- **Node.js missing**: Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
- **Permission errors**: Try `pip install --user svg-generator-mcp` instead

#### MCP Connection Issues
- **Server not starting**: Check that both Python and Node.js are in PATH
- **Tool not appearing**: Verify MCP client configuration syntax
- **Generation failures**: Server runs in demo mode without AI models - this is normal
- **Slow first startup**: Node.js dependencies install on first run (1-2 minutes)

#### AI Generation Issues
- **Demo mode only**: Install AI dependencies manually if needed:
  - Apple Silicon: `pip install mflux`
  - Other platforms: `pip install torch diffusers transformers`
- **Model download failures**: AI features are optional - server works without them

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