# Test Suite

This directory contains the comprehensive test suite for the SVG Generator MCP Server.

## Structure

- `integration/` - Integration tests for the complete uvx deployment workflow
  - `test_debug_paths.py` - Path resolution debugging in uvx environments
  - `test_uvx_final.py` - Final uvx deployment and MCP protocol test
  - `test_mcp_protocol.py` - MCP protocol compliance testing
  - `test_server_startup.py` - Server startup and initialization testing
  - `test_uvx_startup.py` - uvx-specific startup testing

## Running Tests

```bash
# Run all tests
pytest tests/

# Run integration tests only
pytest tests/integration/

# Run specific test
pytest tests/integration/test_mcp_protocol.py -v
```

## Test Categories

### Integration Tests
These tests verify the complete uvx deployment workflow:
- Package installation via uvx
- MCP protocol communication
- Server startup and initialization
- Path resolution in isolated environments
- Node.js dependency bundling

### Development Tests
Tests created during the Docker-to-uvx migration process:
- Path resolution debugging
- Environment compatibility verification
- Package bundling validation