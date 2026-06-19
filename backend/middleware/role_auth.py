from functools import wraps
from flask import jsonify, g
from middleware.jwt_auth import token_required


def role_required(*allowed_roles):
    """
    Decorator factory that restricts route access to specific roles.

    This decorator stacks on top of @token_required. It reads the
    decoded user data from g.current_user (set by token_required) and
    checks whether the user's role is in the list of allowed roles.

    Args:
        *allowed_roles: One or more role strings (e.g., "patient", "doctor").

    Returns:
        403 JSON response if the user's role is not permitted.

    Usage:
        @app.route("/doctor-dashboard")
        @token_required
        @role_required("doctor")
        def doctor_dashboard():
            ...

        @app.route("/upload-report")
        @token_required
        @role_required("patient")
        def upload_report():
            ...
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = g.get("current_user", None)

            if not current_user:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Authentication required.",
                        }
                    ),
                    401,
                )

            user_role = current_user.get("role", "")

            if user_role not in allowed_roles:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Access denied. You do not have permission to access this resource.",
                        }
                    ),
                    403,
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def patient_required(f):
    """Convenience decorator that restricts access to patients only."""
    return role_required("patient")(f)


def doctor_required(f):
    """Convenience decorator that restricts access to doctors only."""
    return role_required("doctor")(f)
