from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import (alerts, analytics, audit, client, dashboard, domain, events, health, imports, rules, sources, stream, analytics_extended)
from .config import settings
from .db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database models and seed default rules/sources
    init_db()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="DNS Guard API",
    description="Observable DNS event monitoring and explainable threat detection engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler formatting errors to standard envelope
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.DEBUG else "An unexpected internal server fault occurred.",
                "details": None,
            }
        },
    )


# API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)
app.include_router(events.router, prefix=api_v1_prefix)
app.include_router(alerts.router, prefix=api_v1_prefix)
app.include_router(rules.router, prefix=api_v1_prefix)
app.include_router(sources.router, prefix=api_v1_prefix)
app.include_router(imports.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(analytics_extended.router, prefix=api_v1_prefix)
app.include_router(domain.router, prefix=api_v1_prefix)
app.include_router(client.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(stream.router, prefix=api_v1_prefix)

# Also expose health and stream at root for convenience
app.include_router(health.router)
app.include_router(stream.router)
