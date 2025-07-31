#!/usr/bin/env python3

import subprocess
import time
import sys

def test_uvx_startup():
    print("🚀 Testing uvx svg-generator-mcp startup")
    
    # Start the process
    process = subprocess.Popen([
        "uvx", "--from", "./dist/svg_generator_mcp-1.0.0-py3-none-any.whl", 
        "svg-generator-mcp"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    # Wait a bit for startup
    time.sleep(3)
    
    # Send a simple MCP request
    try:
        stdout, stderr = process.communicate(
            input='{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n',
            timeout=5
        )
        
        print("✅ Server started successfully!")
        print(f"STDOUT: {stdout[:200]}...")
        print(f"STDERR: {stderr[:200]}...")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("⏰ Server startup taking longer than expected")
        process.kill()
        stdout, stderr = process.communicate()
        print(f"STDERR: {stderr}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        process.kill()
        return False

if __name__ == "__main__":
    success = test_uvx_startup()
    sys.exit(0 if success else 1)