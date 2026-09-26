from fastapi import APIRouter

from app.routers import health

api_v1_router = APIRouter()

# Include health router (accessible at /api/v1/health as well as root /health)
api_v1_router.include_router(health.router)
