import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint returns welcome message."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "AuraBook" in data["message"]
    assert "version" in data


@pytest.mark.asyncio
async def test_ping_endpoint(client: AsyncClient):
    """Test ping endpoint returns pong."""
    response = await client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"message": "pong"}


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test health endpoint returns status object."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "AuraBook"
    assert "status" in data
    assert "timestamp" in data
    assert "services" in data
