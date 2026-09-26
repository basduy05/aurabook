from fastapi import APIRouter

from app.routers import auth, catalog, health

api_v1_router = APIRouter()

# Include health router
api_v1_router.include_router(health.router)

# Include auth router
api_v1_router.include_router(auth.router)

# Include catalog & book router
api_v1_router.include_router(catalog.router)
