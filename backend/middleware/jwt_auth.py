import jwt
from functools import wraps
from flask import request, jsonify, g
from utils.jwt_utils import decode_token


def token_required(f):
    """
    Decorator that protects routes by requiring a valid JWT Bearer token.

    Responsibilities:
    - Checks for Authorization header with Bearer scheme
    - Verifies and decodes the JWT token
    - Attaches the decoded user data to Flask's g object as g.current_user
    - Returns structured error responses for all failure cases

    Usage:
        @app.route("/protected")
        @token_required
        def protected_route():
            user = g.current_user
            return jsonify({"user_id": user["user_id"]})
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        if not auth_header:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Authorization header is missing. Provide 'Authorization: Bearer <token>'.",
                    }
                ),
                401,
            )

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid Authorization header format. Expected 'Bearer <token>'.",
                    }
                ),
                401,
            )

        token = parts[1]

        try:
            payload = decode_token(token)
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Token has expired. Please log in again.",
                    }
                ),
                401,
            )
        except jwt.InvalidTokenError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid token. Authentication failed.",
                    }
                ),
                401,
            )
        except Exception:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Token verification failed. Please log in again.",
                    }
                ),
                401,
            )

        return f(*args, **kwargs)

    return decorated
