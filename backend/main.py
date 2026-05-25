from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from database import engine, Base
from routers import transactions, settings, reports, auth as auth_router, clients, events, tasks, files, budget
import auth

import logging

# ── Logging Configuration ────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("moneta_api.log")
    ]
)
logger = logging.getLogger("moneta-bank")

Base.metadata.create_all(bind=engine)

# Ensure absolute path for uploads in Docker
BASE_DIR = os.path.abspath(os.getcwd())
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Moneta Bank API starting up...")
    # Verify DB and create tables
    from database import SQLALCHEMY_DATABASE_URL, engine, Base
    logger.info(f"[DB] Initializing with: {SQLALCHEMY_DATABASE_URL.split('@')[-1]}")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[DB] Tables verified/created successfully.")
    except Exception as e:
        logger.error(f"[DB] CRITICAL STARTUP ERROR: {e}")
    yield
    logger.info("Moneta Bank API shutting down...")

app = FastAPI(
    title="Moneta Bank API",
    description="Secure Digital Financial Command Center",
    version="1.2.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error during {request.method} {request.url.path}: {exc}", exc_info=True)
    # Include error detail in response for faster production debugging
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc) if os.getenv("DEBUG") else "An internal server error occurred. Please check logs.",
            "status": "error"
        }
    )

# CORS origins from environment (comma-separated list)
env_origins = os.getenv("CORS_ORIGINS", "").split(",")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://monetabank.monakin.in",
    "http://monetabank.monakin.in",
    "https://monetapages.onrender.com",
    "http://monetapages.onrender.com"
]
if env_origins:
    for o in env_origins:
        clean_origin = o.strip()
        if clean_origin and clean_origin not in origins:
            origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure Storage enabled (access via /api/files)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(files.router, prefix="/api/files", tags=["Secure Files"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"], dependencies=[Depends(auth.get_current_user)])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"], dependencies=[Depends(auth.get_current_user)])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"], dependencies=[Depends(auth.get_current_user)])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"], dependencies=[Depends(auth.get_current_user)])
app.include_router(events.router, prefix="/api/events", tags=["Events"], dependencies=[Depends(auth.get_current_user)])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"], dependencies=[Depends(auth.get_current_user)])
app.include_router(budget.router, prefix="/api/budget", tags=["Budgeting"], dependencies=[Depends(auth.get_current_user)])

@app.get("/")
def root():
    return {"message": "Moneta Bank API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
