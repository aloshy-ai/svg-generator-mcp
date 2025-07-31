#!/usr/bin/env python3

import subprocess
import time
import sys
import json

def test_uvx_final():
    print("🎯 Final uvx svg-generator-mcp test")
    
    # Start the MCP server
    process = subprocess.Popen([
        "uvx", "--from", "./dist/svg_generator_mcp-1.0.0-py3-none-any.whl", 
        "svg-generator-mcp"
    ], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    # Wait for startup
    time.sleep(5)
    
    # Send tools/list request
    request = {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    
    try:
        process.stdin.write(json.dumps(request) + "\n")
        process.stdin.flush()
        
        # Read response
        time.sleep(2)
        output = process.stdout.readline()
        
        if output:
            try:
                response = json.loads(output.strip())
                if "result" in response and "tools" in response["result"]:
                    tools = response["result"]["tools"]
                    print(f"✅ SUCCESS: Found {len(tools)} MCP tools!")
                    tool_names = [t["name"] for t in tools]
                    print(f"   Tools: {', '.join(tool_names)}")
                    return True
                else:
                    print(f"❌ Invalid response structure: {response}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                print(f"   Raw output: {output}")
        else:
            print("❌ No response received")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        process.terminate()
        
        # Read stderr to see any errors
        stderr_output = process.stderr.read()
        if stderr_output:
            print(f"Server stderr: {stderr_output[:200]}...")
            
    return False

if __name__ == "__main__":
    success = test_uvx_final()
    sys.exit(0 if success else 1)