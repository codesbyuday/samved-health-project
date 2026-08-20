from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    portal: Optional[str] = None
    sessionRestore: Optional[bool] = False
    userId: Optional[str] = None
    role: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "citizen"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class UserProfileSchema(BaseModel):
    user_id: str
    access_role: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    roles: Optional[list[str]] = None
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    staff_uuid: Optional[str] = None
    staff_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    joined_at: Optional[str] = None
    official_id: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[UserProfileSchema] = None
    error: Optional[str] = None


class AuthActionResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None
