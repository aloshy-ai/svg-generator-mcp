#!/usr/bin/env python3
"""
SVG Generator MCP Server - uvx entry point

This module provides the main entry point for running the SVG Generator MCP Server
through uvx. It handles dependency management and launches the Node.js server.
"""

import subprocess
import sys
import os
import shutil
from pathlib import Path


def check_node_availability():
    """Check if Node.js is available on the system."""
    if not shutil.which("node"):
        print("Error: Node.js is not installed or not in PATH", file=sys.stderr)
        print("Please install Node.js 18+ from https://nodejs.org/", file=sys.stderr)
        sys.exit(1)


def check_npm_availability():
    """Check if npm is available on the system."""
    if not shutil.which("npm"):
        print("Error: npm is not installed or not in PATH", file=sys.stderr)
        print("Please install Node.js 18+ (includes npm) from https://nodejs.org/", file=sys.stderr)
        sys.exit(1)


def get_package_root():
    """Get the root directory of the Python package."""
    return Path(__file__).parent


def install_node_dependencies():
    """Install Node.js dependencies if needed."""
    package_root = get_package_root()
    node_modules = package_root / "node_modules"
    package_json = package_root / "package.json"
    
    if not package_json.exists():
        print("Error: package.json not found in package", file=sys.stderr)
        sys.exit(1)
    
    # Install dependencies if node_modules doesn't exist
    if not node_modules.exists():
        print("Installing Node.js dependencies...", file=sys.stderr)
        try:
            subprocess.run(
                ["npm", "install", "--production"],
                cwd=package_root,
                check=True,
                capture_output=True
            )
        except subprocess.CalledProcessError as e:
            print(f"Error installing Node.js dependencies: {e}", file=sys.stderr)
            sys.exit(1)


def install_python_dependencies():
    """Install optional Python dependencies for AI features."""
    try:
        # Try to install mflux for Apple Silicon
        if sys.platform == "darwin" and os.uname().machine == "arm64":
            subprocess.run([
                sys.executable, "-m", "pip", "install", "--quiet", "mflux"
            ], check=False, capture_output=True)
        else:
            # Try to install FLUX dependencies for other platforms
            subprocess.run([
                sys.executable, "-m", "pip", "install", "--quiet", 
                "torch", "torchvision", "diffusers", "transformers", "accelerate"
            ], check=False, capture_output=True)
    except Exception:
        # Silently fail - server will run in demo mode
        pass


def main():
    """Main entry point for the SVG Generator MCP Server."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="SVG Generator MCP Server - AI-powered SVG illustration generation"
    )
    parser.add_argument(
        "--version", 
        action="version", 
        version="svg-generator-mcp 1.0.0"
    )
    parser.add_argument(
        "--help-setup", 
        action="store_true",
        help="Show MCP client setup instructions"
    )
    
    args = parser.parse_args()
    
    if args.help_setup:
        print("MCP Client Setup Instructions:")
        print("Add this to your Claude Desktop configuration:")
        print("""
{
  "mcpServers": {
    "svg-generator": {
      "command": "uvx",
      "args": ["svg-generator-mcp"]
    }
  }
}
""")
        return
    
    # Check system requirements
    check_node_availability()
    check_npm_availability()
    
    # Get package paths
    package_root = get_package_root()
    dist_dir = package_root / "dist"
    server_script = dist_dir / "index.js"
    
    # Install dependencies
    install_node_dependencies()
    install_python_dependencies()
    
    # Check if built server exists
    if not server_script.exists():
        print("Error: Server build not found. Please report this issue.", file=sys.stderr)
        sys.exit(1)
    
    # Launch the Node.js MCP server
    try:
        subprocess.run(
            ["node", str(server_script)],
            cwd=package_root,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error running MCP server: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down MCP server...", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()