"""
SmartCityAI - Auth Package
Exports authentication dependencies and role checkers.
"""

from backend.auth.security import (
    AuthenticatedUser,
    authenticate_client,
    require_role,
    ROLE_HIERARCHY,
)

__all__ = [
    "AuthenticatedUser",
    "authenticate_client",
    "require_role",
    "ROLE_HIERARCHY",
]
