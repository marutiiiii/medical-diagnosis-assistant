from flask import Blueprint
from controllers.report_controller import (
    upload_report_controller,
    get_my_reports_controller,
    get_report_details_controller,
    delete_report_controller,
    get_report_preview_controller,
)
from middleware.jwt_auth import token_required
from middleware.role_auth import patient_required

# Report Blueprint — all routes will be registered with prefix /api/reports in app.py
report_bp = Blueprint("reports", __name__)

@report_bp.route("/upload", methods=["POST"])
@token_required
@patient_required
def upload_report_route():
    """
    POST /api/reports/upload
    Uploads a new medical report (Patient only).
    Expects multipart/form-data with field name 'file'.
    """
    return upload_report_controller()


@report_bp.route("/my-reports", methods=["GET"])
@token_required
@patient_required
def get_my_reports_route():
    """
    GET /api/reports/my-reports
    Returns a list of all reports uploaded by the logged-in patient.
    """
    return get_my_reports_controller()


@report_bp.route("/<report_id>", methods=["GET"])
@token_required
@patient_required
def get_report_details_route(report_id):
    """
    GET /api/reports/<report_id>
    Fetches details of a single report owned by the logged-in patient.
    """
    return get_report_details_controller(report_id)


@report_bp.route("/<report_id>", methods=["DELETE"])
@token_required
@patient_required
def delete_report_route(report_id):
    """
    DELETE /api/reports/<report_id>
    Deletes a specific report owned by the logged-in patient.
    """
    return delete_report_controller(report_id)


@report_bp.route("/<report_id>/preview", methods=["GET"])
@token_required
@patient_required
def get_report_preview_route(report_id):
    """
    GET /api/reports/<report_id>/preview
    Returns the first 1500 characters of the extracted text of the report.
    """
    return get_report_preview_controller(report_id)
