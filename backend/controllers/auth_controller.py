from flask import request, jsonify, g
from services.auth_service import register_user, login_user, get_user_profile


def register():
    """
    Controller for POST /api/auth/register

    Parses the incoming JSON payload and delegates to the auth service
    for validation, password hashing, and database insertion.

    Returns:
        JSON response with success/failure status and HTTP status code.
    """
    if not request.is_json:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Request body must be JSON. Set Content-Type: application/json.",
                }
            ),
            415,
        )

    data = request.get_json(silent=True)

    if data is None:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid or empty JSON body.",
                }
            ),
            400,
        )

    response, status_code = register_user(data)
    return jsonify(response), status_code


def login():
    """
    Controller for POST /api/auth/login

    Parses the incoming JSON payload and delegates to the auth service
    for credential verification and JWT token generation.

    Returns:
        JSON response with JWT token and user info on success,
        or error details on failure.
    """
    if not request.is_json:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Request body must be JSON. Set Content-Type: application/json.",
                }
            ),
            415,
        )

    data = request.get_json(silent=True)

    if data is None:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid or empty JSON body.",
                }
            ),
            400,
        )

    response, status_code = login_user(data)
    return jsonify(response), status_code


def get_profile():
    """
    Controller for GET /api/auth/profile

    Reads the authenticated user's ID from g.current_user (populated
    by the @token_required middleware) and fetches their profile from
    the database.

    Returns:
        JSON response with the user's profile data.
    """
    current_user = g.get("current_user", None)

    if not current_user:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unauthorized. Authentication required.",
                }
            ),
            401,
        )

    user_id = current_user.get("user_id")
    response, status_code = get_user_profile(user_id)
    return jsonify(response), status_code
