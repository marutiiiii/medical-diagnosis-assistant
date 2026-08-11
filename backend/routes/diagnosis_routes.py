from flask import Blueprint
from controllers.diagnosis_controller import (
    generate_diagnosis_controller,
    get_diagnoses_by_patient_controller
)
from middleware.jwt_auth import token_required
from middleware.role_auth import patient_required, doctor_required

diagnosis_bp = Blueprint("diagnosis", __name__)

@diagnosis_bp.route("/from_report", methods=["POST"])
@token_required
@patient_required
def generate_diagnosis_route():
    """
    POST /api/diagnosis/from_report
    Generates a diagnosis based on a patient's question and a specified report ID.
    (Patient only)
    """
    return generate_diagnosis_controller()


@diagnosis_bp.route("/by_patient_name/<patient_name>", methods=["GET"])
@token_required
@doctor_required
def get_diagnoses_by_patient_route(patient_name):
    """
    GET /api/diagnosis/by_patient_name/<patient_name>
    Fetches diagnosis history for a given patient by their name.
    (Doctor only)
    """
    return get_diagnoses_by_patient_controller(patient_name)
