from flask import Blueprint, jsonify
from controllers.auth_controller import register, login, get_profile
from middleware.jwt_auth import token_required
from middleware.role_auth import patient_required, doctor_required

# Auth Blueprint — all routes prefixed with /api/auth
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ─────────────────────────────────────────
# Public Auth Routes
# ─────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register_route():
    """
    POST /api/auth/register
    Register a new user (patient or doctor).
    """
    return register()


@auth_bp.route("/login", methods=["POST"])
def login_route():
    """
    POST /api/auth/login
    Authenticate a user and return a JWT token.
    """
    return login()


# ─────────────────────────────────────────
# Protected Auth Routes
# ─────────────────────────────────────────

@auth_bp.route("/profile", methods=["GET"])
@token_required
def profile_route():
    """
    GET /api/auth/profile
    Fetch the authenticated user's profile.
    Requires: Authorization: Bearer <token>
    """
    return get_profile()


# ─────────────────────────────────────────
# Patient-Only Routes (stubs for integration)
# ─────────────────────────────────────────

@auth_bp.route("/upload-report", methods=["POST"])
@token_required
@patient_required
def upload_report():
    """
    POST /api/auth/upload-report
    Patient only — upload a medical report.
    """
    return jsonify({"success": True, "message": "Report upload endpoint (patient only)."}), 200


@auth_bp.route("/diagnosis-chat", methods=["POST"])
@token_required
@patient_required
def diagnosis_chat():
    """
    POST /api/auth/diagnosis-chat
    Patient only — send a message to the diagnosis chat.
    """
    return jsonify({"success": True, "message": "Diagnosis chat endpoint (patient only)."}), 200


@auth_bp.route("/diagnosis-history", methods=["GET"])
@token_required
@patient_required
def diagnosis_history():
    """
    GET /api/auth/diagnosis-history
    Patient only — view past diagnosis history.
    """
    return jsonify({"success": True, "message": "Diagnosis history endpoint (patient only)."}), 200


# ─────────────────────────────────────────
# Doctor-Only Routes (stubs for integration)
# ─────────────────────────────────────────

@auth_bp.route("/patient-search", methods=["GET"])
@token_required
@doctor_required
def patient_search():
    """
    GET /api/auth/patient-search
    Doctor only — search for patients.
    """
    return jsonify({"success": True, "message": "Patient search endpoint (doctor only)."}), 200


@auth_bp.route("/patient-history", methods=["GET"])
@token_required
@doctor_required
def patient_history():
    """
    GET /api/auth/patient-history
    Doctor only — view a patient's full history.
    """
    return jsonify({"success": True, "message": "Patient history endpoint (doctor only)."}), 200


@auth_bp.route("/doctor-dashboard", methods=["GET"])
@token_required
@doctor_required
def doctor_dashboard():
    """
    GET /api/auth/doctor-dashboard
    Doctor only — view the doctor's dashboard.
    """
    return jsonify({"success": True, "message": "Doctor dashboard endpoint (doctor only)."}), 200
