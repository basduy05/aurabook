from fastapi import APIRouter

from app.routers import auth, cart, catalog, health, orders, payments

api_v1_router = APIRouter()

# 1. Health checks
api_v1_router.include_router(health.router)

# 2. Authentication & Profile
api_v1_router.include_router(auth.router)

# 3. Catalog & Book Products
api_v1_router.include_router(catalog.router)

# 4. Shopping Cart
api_v1_router.include_router(cart.router)

# 5. Orders & Checkout (UC04)
api_v1_router.include_router(orders.router)

# 6. Payments & Webhooks
api_v1_router.include_router(payments.router)
