from fastapi import APIRouter

from app.routers import auth, health

api_v1_router = APIRouter()

# Include health router
api_v1_router.include_router(health.router)

# Include auth router
api_v1_router.include_router(auth.router)