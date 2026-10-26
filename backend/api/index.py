import os
import sys

# Ensure the backend root directory is present in sys.path so 'app' is resolvable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app

# Export app for Vercel Serverless Function handler
__all__ = ["app"]
