import os
import sys

# Ensure backend root directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app as _fastapi_app


async def app(scope, receive, send):
    """
    ASGI entrypoint for Vercel Serverless Functions.
    Resolves original request path from Vercel edge rewrite headers (x-matched-path, x-forwarded-uri)
    if Vercel rewritten scope['path'] points to /api/index.py or /api/index.
    """
    if scope["type"] == "http":
        path = scope.get("path", "")
        if path in ("/api/index.py", "/api/index", "/api", "/api/"):
            headers = dict(scope.get("headers", []))
            matched_path = (
                headers.get(b"x-matched-path", b"")
                or headers.get(b"x-forwarded-uri", b"")
                or headers.get(b"x-original-uri", b"")
                or headers.get(b"x-real-path", b"")
            ).decode("utf-8", "ignore")

            if matched_path and matched_path not in ("/api/index.py", "/api/index"):
                path = matched_path
            else:
                path = "/"

        # Normalize trailing slashes for standard routes (e.g. /docs/ -> /docs)
        if len(path) > 1 and path.endswith("/"):
            path = path.rstrip("/")

        scope["path"] = path
        scope["raw_path"] = path.encode("utf-8")

    await _fastapi_app(scope, receive, send)


__all__ = ["app"]
