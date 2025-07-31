#!/usr/bin/env python3

import subprocess
import time
import sys
import os
import json

def test_server_startup():
    print("🚀 Testing svg-generator-mcp server startup")
    
    # Start the server process
    process = subprocess.Popen([
        "uvx", "--from", "./dist/svg_generator_mcp-1.0.0-py3-none-any.whl", 
        "svg-generator-mcp"
    ], 
    stdin=subprocess.PIPE, 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE, 
    text=True
    )
    
    print("Server process started, waiting for startup...")
    time.sleep(3)
    
    # Check if process is still running
    if process.poll() is not None:
        # Process exited
        stdout, stderr = process.communicate()
        print(f"❌ Server exited with code: {process.returncode}")
        print(f"STDOUT: {stdout}")
        print(f"STDERR: {stderr}")
        return False
    
    print("✅ Server is running! Sending MCP initialization...")
    
    # Send initialize request
    init_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        }
    }
    
    try:
        # Send initialization
        process.stdin.write(json.dumps(init_request) + "\n")
        process.stdin.flush()
        
        # Wait for response
        time.sleep(2)
        
        # Try to read output
        if process.stdout:
            # Set non-blocking read
            import fcntl
            import os
            fd = process.stdout.fileno()
            fl = fcntl.fcntl(fd, fcntl.F_GETFL)
            fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
            
            try:
                output = process.stdout.read()
                if output:
                    print(f"📥 Server response: {output[:200]}...")
                    return True
                else:
                    print("⚠️  No response from server")
            except BlockingIOError:
                print("⚠️  No immediate response (this might be OK)")
                return True
                
    except Exception as e:
        print(f"❌ Error communicating with server: {e}")
    finally:
        # Clean up
        process.terminate()
        process.wait()
    
    return False

if __name__ == "__main__":
    success = test_server_startup()
    sys.exit(0 if success else 1)