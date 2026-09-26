import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.schemas.user import UserResponse


class AuthService:
    """Core Authentication & User Identity Service."""

    @staticmethod
    async def register(db: AsyncSession, req: UserRegisterRequest) -> TokenResponse:
        """Register a new customer account and return authenticated tokens."""
        stmt = select(User).where(User.email == req.email.lower().strip())
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.",
            )

        user = User(
            email=req.email.lower().strip(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone_number=req.phone_number.strip() if req.phone_number else None,
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return AuthService.build_token_response(user)

    @staticmethod
    async def login(db: AsyncSession, req: UserLoginRequest) -> TokenResponse:
        """Authenticate user credentials and return authenticated tokens."""
        stmt = select(User).where(User.email == req.email.lower().strip())
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email hoặc mật khẩu không chính xác.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.",
            )

        return AuthService.build_token_response(user)

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession, req: RefreshTokenRequest
    ) -> TokenResponse:
        """Issue new access and refresh tokens from a valid refresh token."""
        payload = decode_token(req.refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token không hợp lệ hoặc đã hết hạn.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id_str = payload.get("sub")
        try:
            user_uuid = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload không hợp lệ.",
            )

        stmt = select(User).where(User.id == user_uuid)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Người dùng không hợp lệ hoặc đã bị vô hiệu hóa.",
            )

        return AuthService.build_token_response(user)

    @staticmethod
    def build_token_response(user: User) -> TokenResponse:
        """Generate JWT Access + Refresh tokens and format standard TokenResponse."""
        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
        )
        refresh_token = create_refresh_token(subject=user.id)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )
