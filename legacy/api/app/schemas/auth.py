from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=6, max_length=128, description="Mật khẩu tối thiểu 6 ký tự"
    )
    full_name: str = Field(
        min_length=2, max_length=150, description="Họ và tên người dùng"
    )
    phone_number: str | None = Field(
        None, max_length=20, description="Số điện thoại liên hệ"
    )


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str
