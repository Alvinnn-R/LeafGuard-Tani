"""
main.py — FastAPI app entry point untuk LeafGuard Tani API.

Tanggung jawab:
  - Load environment variables
  - Konfigurasi CORS middleware
  - Register routers
  - Root endpoint

Ref: CLAUDE.md §4, plan.md §Architecture
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.analyze import router as analyze_router
from routers.history import router as history_router

# Load .env file (development only, Cloud Run uses env vars langsung)
load_dotenv()

app = FastAPI(
    title="LeafGuard Tani API",
    version="1.0.0",
    description="AI-powered rice plant disease detection and agricultural product label interpretation.",
)

# ============================================================
# CORS Middleware
# ============================================================

ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:4173",   # Vite preview
    "http://localhost:3000",   # Alternative dev port
]

# Tambahkan production frontend URL jika di-set
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Register Routers
# ============================================================

app.include_router(analyze_router)
app.include_router(history_router)


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
async def read_root():
    """Root endpoint — informasi dasar API."""
    return {
        "message": "Selamat datang di LeafGuard Tani API!",
        "docs": "/docs",
        "health": "/health",
    }
