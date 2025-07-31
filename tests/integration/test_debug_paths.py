#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path

# Test what paths uvx is using
print("🔍 Debugging uvx package paths")

process = subprocess.Popen([
    "uvx", "--from", "./dist/svg_generator_mcp-1.0.0-py3-none-any.whl", 
    "python", "-c", 
    """
import sys
from pathlib import Path

# Test the updated get_package_root logic
def get_package_root():
    try:
        return Path(__file__).parent
    except NameError:
        import svg_generator_mcp
        return Path(svg_generator_mcp.__file__).parent

print('Python executable:', sys.executable)
print('Python path:', sys.path[0])
print('__file__ location:', __file__ if '__file__' in globals() else 'N/A')

package_root = get_package_root()
print('Package root:', package_root)
print('Package root exists:', package_root.exists())
if package_root.exists():
    print('Contents:', list(package_root.iterdir()))

dist_dir = package_root / 'dist'
print('Dist dir:', dist_dir) 
print('Dist exists:', dist_dir.exists())
if dist_dir.exists():
    print('Dist contents:', list(dist_dir.iterdir()))

index_js = dist_dir / 'index.js'
print('index.js path:', index_js)
print('index.js exists:', index_js.exists())
"""
], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

stdout, stderr = process.communicate()
print("STDOUT:")
print(stdout)
print("STDERR:")  
print(stderr)