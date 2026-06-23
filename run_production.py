import os
import sys
from pathlib import Path
from waitress import serve
from server import app

# ponytail: Production runner for Waitress. Uses native WSGI serving.
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting production WSGI server on port {port} using Waitress...")
    sys.stdout.flush()
    serve(app, host="0.0.0.0", port=port)
