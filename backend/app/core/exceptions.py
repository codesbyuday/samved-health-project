from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class BaseAppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        code: str = "BAD_REQUEST",
        details: Optional[Any] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={"success": False, "error": {"code": code, "message": message, "details": details}},
        )


class NotFoundException(BaseAppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            code="NOT_FOUND",
        )


class UnauthorizedException(BaseAppException):
    def __init__(self, message: str = "Invalid credentials or session expired"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="UNAUTHORIZED",
        )


class ForbiddenException(BaseAppException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="FORBIDDEN",
        )


class BadRequestException(BaseAppException):
    def __init__(self, message: str = "Invalid request parameter"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            code="BAD_REQUEST",
        )
