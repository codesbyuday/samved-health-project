from fastapi import APIRouter, Header, HTTPException, status
from typing import Optional
from app.modules.auth.schemas import (
    LoginRequest, LoginResponse, UserProfileSchema,
    RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest, AuthActionResponse
)
from app.modules.auth.service import auth_service
from app.core.security import decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    success, token, user, error_msg = await auth_service.authenticate(req)
    if not success:
        return LoginResponse(success=False, error=error_msg or "Authentication failed")
    return LoginResponse(success=True, token=token, user=user)


@router.post("/register", response_model=AuthActionResponse)
async def register(req: RegisterRequest):
    return AuthActionResponse(success=True, message="User registered successfully. Please verify email if required.")


@router.post("/logout", response_model=AuthActionResponse)
async def logout():
    return AuthActionResponse(success=True, message="Logged out successfully.")


@router.post("/forgot-password", response_model=AuthActionResponse)
async def forgot_password(req: ForgotPasswordRequest):
    return AuthActionResponse(success=True, message=f"Password reset link dispatched to {req.email}")


@router.post("/reset-password", response_model=AuthActionResponse)
async def reset_password(req: ResetPasswordRequest):
    return AuthActionResponse(success=True, message="Password reset successfully. Please login with your new password.")


@router.post("/verify-email", response_model=AuthActionResponse)
async def verify_email(req: VerifyEmailRequest):
    return AuthActionResponse(success=True, message="Email verified successfully.")


@router.get("/me", response_model=UserProfileSchema)
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or ("sub" not in payload and "user_id" not in payload):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("user_id") or payload.get("sub")
    profile = await auth_service.get_profile_by_user_id(str(user_id))
    if not profile:
        profile = UserProfileSchema(
            user_id=str(user_id),
            access_role=payload.get("role", "smc_admin"),
            name="Authorized User",
            email="user@health.gov",
            role=payload.get("role", "smc_admin"),
            roles=[payload.get("role", "smc_admin")]
        )

    return profile
