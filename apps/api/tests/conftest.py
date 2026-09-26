from collections.abc import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_application


@pytest.fixture
def app():
    """Create test application instance."""
    application = create_application()
    return application


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
