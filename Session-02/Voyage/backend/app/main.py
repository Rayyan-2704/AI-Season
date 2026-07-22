import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.exceptions import register_exception_handlers
from app.routers import auth, itineraries, trips

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Voyage API",
    description="Backend API for Voyage — a slow-travel editorial trip planner.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itineraries.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "Voyage API"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}