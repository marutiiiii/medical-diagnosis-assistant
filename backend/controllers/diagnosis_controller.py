from flask import request, jsonify, g
import services.rag_service as rag_service
import services.diagnosis_service as diagnosis_service

def generate_diagnosis_controller():
    """
    POST /api/diagnosis/from_report
    Body:
    {
        "report_id": "uuid",
        "question": "What does my X-ray say?"
    }
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
        
    user_id = current_user.get("user_id")
    
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body must be JSON."}), 400
        
    report_id = data.get("report_id")
    question = data.get("question")
    
    if not report_id or not question:
        return jsonify({"success": False, "message": "report_id and question are required."}), 400
        
    try:
        # Generate the diagnosis via AI
        answer = rag_service.generate_diagnosis(report_id, question)
        
        # Save to database
        db_res, status = diagnosis_service.save_diagnosis(user_id, report_id, question, answer)
        if not db_res.get("success"):
            print(f"Warning: Failed to save diagnosis to DB: {db_res}")
            
        return jsonify({
            "success": True,
            "answer": answer,
            "report_id": report_id
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"AI Generation failed: {str(e)}"}), 500


def get_diagnoses_by_patient_controller(patient_name: str):
    """
    GET /api/diagnosis/by_patient_name/<patient_name>
    """
    current_user = g.get("current_user", None)
    if not current_user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
        
    if not patient_name or not patient_name.strip():
        return jsonify({"success": False, "message": "patient_name is required."}), 400
        
    try:
        response, status = diagnosis_service.get_diagnoses_by_patient_name(patient_name.strip())
        return jsonify(response), status
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to retrieve diagnoses: {str(e)}"}), 500
