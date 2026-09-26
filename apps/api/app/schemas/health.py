from datetime import datetime

from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str
    latency_ms: float | None = None
    error: str | None = None


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy")
    app_name: str = Field(default="AuraBook")
    environment: str = Field(default="development")
    version: str = Field(default="0.1.0")
    timestamp: datetime
    services: dict[str, ServiceStatus] = Field(default_factory=dict)


# Alias for backward compatibility
HealthResponse = HealthCheckResponse
