import re
from database.supabase_client import get_supabase_client
from utils.password_utils import hash_password, verify_password
from utils.jwt_utils import generate_token


VALID_ROLES = {"patient", "doctor"}
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def _validate_registration_payload(data: dict) -> tuple[bool, str]:
    """
    Validate all fields in the registration request.

    Returns:
        (is_valid, error_message) — error_message is empty string if valid.
    """
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "").strip().lower()

    if not full_name:
        return False, "full_name is required."

    if not email:
        return False, "email is required."

    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format."

    if not password:
        return False, "password is required."

    if len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if not role:
        return False, "role is required."

    if role not in VALID_ROLES:
        return False, f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}."

    return True, ""


def register_user(data: dict) -> tuple[dict, int]:
    """
    Register a new user in the system.

    Steps:
    1. Validate input fields
    2. Check if email is already registered
    3. Hash the password using bcrypt
    4. Insert the user record into Supabase
    5. Return a success response

    Args:
        data: Dictionary containing full_name, email, password, role.

    Returns:
        (response_dict, http_status_code)
    """
    is_valid, error_msg = _validate_registration_payload(data)
    if not is_valid:
        return {"success": False, "message": error_msg}, 400

    full_name = data["full_name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    role = data["role"].strip().lower()

    try:
        supabase = get_supabase_client()

        # Check for existing email
        existing = (
            supabase.table("users").select("id").eq("email", email).execute()
        )

        if existing.data and len(existing.data) > 0:
            return {"success": False, "message": "Email already registered."}, 409

        # Hash password
        hashed_pw = hash_password(password)

        # Insert new user
        result = (
            supabase.table("users")
            .insert(
                {
                    "full_name": full_name,
                    "email": email,
                    "password": hashed_pw,
                    "role": role,
                }
            )
            .execute()
        )

        if not result.data:
            return {
                "success": False,
                "message": "Registration failed. Please try again.",
            }, 500

        return {"success": True, "message": "User registered successfully."}, 201

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}",
        }, 500


def login_user(data: dict) -> tuple[dict, int]:
    """
    Authenticate a user and issue a JWT token.

    Steps:
    1. Validate email and password are present
    2. Find user by email in Supabase
    3. Verify the bcrypt password hash
    4. Generate a signed JWT token
    5. Return token and user info

    Args:
        data: Dictionary containing email and password.

    Returns:
        (response_dict, http_status_code)
    """
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return {"success": False, "message": "email is required."}, 400

    if not password:
        return {"success": False, "message": "password is required."}, 400

    try:
        supabase = get_supabase_client()

        result = (
            supabase.table("users")
            .select("id, full_name, email, password, role")
            .eq("email", email)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            return {"success": False, "message": "Invalid email or password."}, 401

        user = result.data[0]

        if not verify_password(password, user["password"]):
            return {"success": False, "message": "Invalid email or password."}, 401

        token = generate_token(
            user_id=user["id"],
            email=user["email"],
            role=user["role"],
        )

        return {
            "success": True,
            "token": token,
            "role": user["role"],
            "user_id": str(user["id"]),
            "full_name": user["full_name"],
        }, 200

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}",
        }, 500


def get_user_profile(user_id: str) -> tuple[dict, int]:
    """
    Fetch and return the authenticated user's profile.

    Args:
        user_id: The UUID string of the user extracted from the JWT token.

    Returns:
        (response_dict, http_status_code)
    """
    try:
        supabase = get_supabase_client()

        result = (
            supabase.table("users")
            .select("id, full_name, email, role, created_at")
            .eq("id", user_id)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            return {"success": False, "message": "User not found."}, 404

        user = result.data[0]

        return {
            "success": True,
            "data": {
                "id": str(user["id"]),
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "created_at": user.get("created_at"),
            },
        }, 200

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}",
        }, 500
