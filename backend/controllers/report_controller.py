from flask import request, jsonify, g
import services.report_service as report_service

def upload_report_controller():
    """
    Controller for POST /api/reports/upload
    Receives multipart file, validates presence of file, and delegates to service.
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized. Authentication required."}), 401
    
    user_id = current_user.get("user_id")

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file part in the request. Use field name 'file'."}), 400
        
    file = request.files["file"]
    
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "No file selected for upload."}), 400

    try:
        file_bytes = file.read()
        response, status_code = report_service.upload_report(
            user_id=user_id,
            file_bytes=file_bytes,
            original_filename=file.filename
        )
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"success": False, "message": f"An unexpected error occurred during upload: {str(e)}"}), 500


def get_my_reports_controller():
    """
    Controller for GET /api/reports/my-reports
    Fetches all reports for the currently authenticated patient.
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized. Authentication required."}), 401
        
    user_id = current_user.get("user_id")
    response, status_code = report_service.get_user_reports(user_id)
    return jsonify(response), status_code


def get_report_details_controller(report_id):
    """
    Controller for GET /api/reports/<report_id>
    Fetches details of a single report with ownership validation.
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized. Authentication required."}), 401
        
    user_id = current_user.get("user_id")
    response, status_code = report_service.get_report_details(report_id, user_id)
    return jsonify(response), status_code


def delete_report_controller(report_id):
    """
    Controller for DELETE /api/reports/<report_id>
    Deletes report and files from storage and database.
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized. Authentication required."}), 401
        
    user_id = current_user.get("user_id")
    response, status_code = report_service.delete_report(report_id, user_id)
    return jsonify(response), status_code


def get_report_preview_controller(report_id):
    """
    Controller for GET /api/reports/<report_id>/preview
    Extracts text from report PDF and returns a 1500 character snippet.
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized. Authentication required."}), 401
        
    user_id = current_user.get("user_id")
    response, status_code = report_service.get_report_preview(report_id, user_id)
    return jsonify(response), status_code
