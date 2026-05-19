from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[UserRole] = UserRole.EMPLOYEE
    employee_id: Optional[str] = None
    is_active: Optional[bool] = True

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: str
    username: str
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

from typing import Optional, Union
...
class TokenPayload(BaseModel):
    sub: Optional[Union[int, str]] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class OTPVerifyRequest(BaseModel):
    username: str
    code: str

class SignUpRequest(BaseModel):
    full_name: str
    employee_id: str
    email: EmailStr
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    password: str

class ForgotPasswordRequest(BaseModel):
    username_or_email: str

class PasswordResetRequest(BaseModel):
    username_or_email: str
    code: str
    new_password: str
