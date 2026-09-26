from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.schemas.user import UserResponse, UserUpdateRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix=/auth, tags=[Authentication & User Profile])


@router.post(
    /register,
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary=Đăng ký tài khoản độc giả mới,
)
async def register(
    req: UserRegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    "Tạo tài khoản độc giả mới, băm mật khẩu an toàn và trả về token đăng nhập ngay."
    return await AuthService.register(db, req)


@router.post(
    /login,
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary=Đăng nhập hệ thống,
)
async def login(
    req: UserLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    "Xác thực thông tin tài khoản và trả về JWT Access Token + Refresh Token."
    return await AuthService.login(db, req)


@router.post(
    /refresh,
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary=Làm mới Access Token,
)
async def refresh_tokens(
    req: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    "Sử dụng Refresh Token hợp lệ để cấp mới bộ Access Token và Refresh Token."
    return await AuthService.refresh_tokens(db, req)


@router.get(
    /me,
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary=Lấy thông tin tài khoản hiện tại,
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    "Truy xuất thông tin chi tiết của người dùng đang đăng nhập."
    return UserResponse.model_validate(current_user)


@router.put(
    /me,
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary=Cập nhật thông tin cá nhân,
)
async def update_me(
    req: UserUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    "Cập nhật họ tên, số điện thoại, avatar của người dùng."
    if req.full_name is not None:
        current_user.full_name = req.full_name.strip()
    if req.phone_number is not None:
        current_user.phone_number = req.phone_number.strip()
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url.strip()

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)