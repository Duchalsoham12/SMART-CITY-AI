"""
SmartCityAI - Authentication & Role-Based Access Control (RBAC)
Enforces secure API key and bearer token verification with hierarchical roles.
"""

import secrets
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from backend.config import settings

# Header extractors
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    """Authenticated caller identity and assigned role."""
    api_key_name: str
    role: str  # 'viewer', 'analyst', 'admin'


ROLE_HIERARCHY = {
    "viewer": 1,
    "analyst": 2,
    "admin": 3,
}


def authenticate_client(
    api_key: Optional[str] = Security(api_key_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(http_bearer),
) -> AuthenticatedUser:
    """
    Extracts and validates credentials from X-API-Key or Authorization Bearer header.
    Maps authorized keys to corresponding roles using constant-time comparison.
    """
    token = api_key or (bearer.credentials if bearer else None)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials. Provide 'X-API-Key' or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Match token to configured environment secrets using constant-time comparison
    if secrets.compare_digest(token, settings.API_KEY_ADMIN):
        return AuthenticatedUser(api_key_name="AdminKey", role="admin")
    elif secrets.compare_digest(token, settings.API_KEY_ANALYST):
        return AuthenticatedUser(api_key_name="AnalystKey", role="analyst")
    elif secrets.compare_digest(token, settings.API_KEY_VIEWER):
        return AuthenticatedUser(api_key_name="ViewerKey", role="viewer")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication key.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(min_role: str):
    """
    Dependency factory verifying that caller holds at least the minimum required role.
    Role precedence: admin > analyst > viewer.
    """
    def role_checker(user: AuthenticatedUser = Depends(authenticate_client)) -> AuthenticatedUser:
        user_level = ROLE_HIERARCHY.get(user.role, 0)
        required_level = ROLE_HIERARCHY.get(min_role, 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires '{min_role}' role or higher. Current role: '{user.role}'.",
            )
        return user

    return role_checker
