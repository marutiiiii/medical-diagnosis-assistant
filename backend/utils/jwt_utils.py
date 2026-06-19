import jwt
import datetime
from config import get_config


def generate_token(user_id: str, email: str, role: str) -> str:
    """
    Generate a signed JWT token for an authenticated user.

    Args:
        user_id: The UUID of the user from the database.
        email: The user's email address.
        role: The user's role (patient or doctor).

    Returns:
        A signed JWT token string valid for 24 hours.
    """
    config = get_config()
    expiry = datetime.datetime.utcnow() + datetime.timedelta(
        hours=config.JWT_EXPIRY_HOURS
    )

    payload = {
        "user_id": str(user_id),
        "email": email,
        "role": role,
        "exp": expiry,
        "iat": datetime.datetime.utcnow(),
    }

    token = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.

    Args:
        token: The raw JWT token string.

    Returns:
        The decoded payload as a dictionary.

    Raises:
        jwt.ExpiredSignatureError: If the token has expired.
        jwt.InvalidTokenError: If the token is invalid or tampered.
    """
    config = get_config()
    payload = jwt.decode(
        token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
    )
    return payload
