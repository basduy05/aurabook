from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: str = Field(..., example="healthy")
    app_name: str = Field(..., example="AuraBook")
    environment: str = Field(..., example="development")
    version: str = Field(..., example="0.1.0")
    timestamp: datetime
    services: Dict[str, ServiceStatus] = Field(default_factory=dict)
