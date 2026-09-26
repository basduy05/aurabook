import uuid
from typing import Annotated, Callable, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    "Dependency: Extract, decode, and validate current authenticated user from Bearer JWT."
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Token xác thực không hợp lệ hoặc đã hết hạn,
            headers={WWW-Authenticate: Bearer},
        )

    if payload.get(type) != access:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Loại token không hợp lệ (yêu cầu access token),
            headers={WWW-Authenticate: Bearer},
        )

    user_id_str = payload.get(sub)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Payload token thiếu định danh người dùng,
            headers={WWW-Authenticate: Bearer},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Định dạng UUID người dùng không hợp lệ,
            headers={WWW-Authenticate: Bearer},
        )

    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=Người dùng không tồn tại trong hệ thống,
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=Tài khoản này đã bị tạm khóa hoặc vô hiệu hóa,
        )

    return user


def require_roles(*allowed_roles: UserRole) -> Callable:
    "Role-based access control dependency factory."
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)]
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=fQuyền truy cập bị từ chối. Yêu cầu quyền: {[r.value for r in allowed_roles]},
            )
        return current_user

    return role_checker


# Shortcuts
require_admin = require_roles(UserRole.ADMIN)
require_staff = require_roles(UserRole.ADMIN, UserRole.STAFF)