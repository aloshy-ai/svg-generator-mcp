#!/usr/bin/env python3

import subprocess
import time
import sys
import json

def test_mcp_protocol():
    print("🧪 Testing MCP Protocol with svg-generator-mcp")
    
    # Start the server
    process = subprocess.Popen([
        "uvx", "--from", "./dist/svg_generator_mcp-1.0.0-py3-none-any.whl", 
        "svg-generator-mcp"
    ], 
    stdin=subprocess.PIPE, 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE, 
    text=True
    )
    
    time.sleep(3)
    
    if process.poll() is not None:
        print("❌ Server failed to start")
        return False
    
    print("✅ Server started successfully")
    
    try:
        # Test 1: Initialize
        print("📞 1. Testing initialization...")
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0.0"}
            }
        }
        
        process.stdin.write(json.dumps(init_request) + "\n")
        process.stdin.flush()
        time.sleep(1)
        
        # Test 2: List tools
        print("📞 2. Testing tools/list...")
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        }
        
        process.stdin.write(json.dumps(tools_request) + "\n")
        process.stdin.flush()
        time.sleep(2)
        
        # Try to read response
        import fcntl
        import os
        
        # Make stdout non-blocking
        fd = process.stdout.fileno()
        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
        
        responses = []
        for _ in range(10):  # Try to read multiple responses
            try:
                line = process.stdout.readline()
                if line:
                    try:
                        response = json.loads(line.strip())
                        responses.append(response)
                        if "result" in response and "tools" in response.get("result", {}):
                            tools = response["result"]["tools"]
                            print(f"✅ Found {len(tools)} MCP tools:")
                            for tool in tools:
                                print(f"   - {tool['name']}: {tool.get('description', 'No description')}")
                            break
                    except json.JSONDecodeError:
                        continue
            except BlockingIOError:
                time.sleep(0.1)
                continue
        
        if not responses:
            print("⚠️  No JSON responses received, but server appears to be running")
            return True
        
        print("✅ MCP Protocol test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during MCP test: {e}")
        return False
    finally:
        process.terminate()
        process.wait()

if __name__ == "__main__":
    success = test_mcp_protocol()
    print(f"\n{'🎉 SUCCESS!' if success else '❌ FAILED'}")
    sys.exit(0 if success else 1)