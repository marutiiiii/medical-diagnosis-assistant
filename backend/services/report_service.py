import os
import uuid
from database.supabase_client import get_supabase_client
import services.storage_service as storage_service
import services.pdf_service as pdf_service

import services.rag_service as rag_service

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def upload_report(user_id: str, file_bytes: bytes, original_filename: str) -> tuple[dict, int]:
    """
    Validates, uploads report to storage, saves database record, and upserts to Pinecone.
    """
    # Validate extension
    if not original_filename.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Invalid file type. Only PDF files are allowed."
        }, 400

    # Validate size (10 MB = 10 * 1024 * 1024 bytes)
    max_size = 10 * 1024 * 1024
    if len(file_bytes) > max_size:
        return {
            "success": False,
            "message": "File size exceeds the maximum limit of 10 MB."
        }, 400

    try:
        # Generate unique secure filename
        unique_filename = f"{uuid.uuid4()}.pdf"
        storage_path = f"{user_id}/{unique_filename}"

        # Upload to Supabase Storage
        file_url = storage_service.upload_file(
            file_bytes=file_bytes,
            storage_path=storage_path,
            content_type="application/pdf"
        )

        # Save to database
        supabase = get_supabase_client()
        result = supabase.table("reports").insert({
            "user_id": user_id,
            "report_name": original_filename,
            "file_url": file_url
        }).execute()

        if not result.data or len(result.data) == 0:
            # Cleanup storage on DB insert failure
            try:
                storage_service.delete_file(storage_path)
            except Exception:
                pass
            return {
                "success": False,
                "message": "Failed to save report record to the database."
            }, 500

        report_record = result.data[0]
        report_id = str(report_record["id"])
        
        # Save locally to extract text
        temp_filepath = os.path.join(UPLOAD_DIR, unique_filename)
        try:
            with open(temp_filepath, "wb") as f:
                f.write(file_bytes)
                
            # Extract text
            extracted_text = pdf_service.extract_text_from_pdf(temp_filepath)
            
            # Upsert to Pinecone vector DB
            rag_service.upsert_report_to_pinecone(report_id, extracted_text)
            
        except Exception as vec_err:
            print(f"Warning: Failed to vectorize report {report_id}: {vec_err}")
            # We don't fail the upload entirely if vectorization fails, but we might want to log it
        finally:
            if os.path.exists(temp_filepath):
                try:
                    os.remove(temp_filepath)
                except Exception:
                    pass

        return {
            "success": True,
            "message": "Report uploaded and processed successfully",
            "report_id": report_id,
            "file_url": report_record["file_url"]
        }, 201

    except Exception as e:
        return {
            "success": False,
            "message": f"Storage or Database failure: {str(e)}"
        }, 500


def get_user_reports(user_id: str) -> tuple[list, int]:
    """
    Fetches all report records belonging to the specified user.
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("reports").select("id, report_name, file_url, uploaded_at").eq("user_id", user_id).execute()
        
        reports_list = []
        if result.data:
            for row in result.data:
                reports_list.append({
                    "id": str(row["id"]),
                    "report_name": row["report_name"],
                    "file_url": row["file_url"],
                    "uploaded_at": row["uploaded_at"]
                })
        return reports_list, 200
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}"}, 500


def get_report_details(report_id: str, user_id: str) -> tuple[dict, int]:
    """
    Fetches the details of a single report and verifies ownership.
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("reports").select("*").eq("id", report_id).execute()

        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "message": "Report not found."
            }, 404

        report = result.data[0]

        # Verify ownership
        if str(report["user_id"]) != str(user_id):
            return {
                "success": False,
                "message": "Access denied. You do not have permission to view this report."
            }, 403

        return {
            "id": str(report["id"]),
            "user_id": str(report["user_id"]),
            "report_name": report["report_name"],
            "file_url": report["file_url"],
            "uploaded_at": report["uploaded_at"]
        }, 200

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}"
        }, 500


def delete_report(report_id: str, user_id: str) -> tuple[dict, int]:
    """
    Deletes the report record from the database and deletes the PDF from storage.
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("reports").select("*").eq("id", report_id).execute()

        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "message": "Report not found."
            }, 404

        report = result.data[0]

        # Verify ownership
        if str(report["user_id"]) != str(user_id):
            return {
                "success": False,
                "message": "Access denied. You do not have permission to delete this report."
            }, 403

        # Get storage path
        file_url = report["file_url"]
        storage_path = storage_service.get_storage_path_from_url(file_url)

        # Delete file from storage
        try:
            storage_service.delete_file(storage_path)
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to delete report from storage: {str(e)}"
            }, 500

        # Delete database record
        db_result = supabase.table("reports").delete().eq("id", report_id).execute()
        if not db_result.data:
            return {
                "success": False,
                "message": "Failed to delete report record from the database."
            }, 500

        return {
            "success": True,
            "message": "Report deleted successfully"
        }, 200

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}"
        }, 500


def get_report_preview(report_id: str, user_id: str) -> tuple[dict, int]:
    """
    Downloads the report, extracts the text content, and returns the first 1500 characters.
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("reports").select("*").eq("id", report_id).execute()

        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "message": "Report not found."
            }, 404

        report = result.data[0]

        # Verify ownership
        if str(report["user_id"]) != str(user_id):
            return {
                "success": False,
                "message": "Access denied. You do not have permission to access this report."
            }, 403

        file_url = report["file_url"]
        storage_path = storage_service.get_storage_path_from_url(file_url)

        # Download from storage
        try:
            file_bytes = storage_service.download_file(storage_path)
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to download report from storage: {str(e)}"
            }, 500

        # Save to local temporary file inside uploads directory for pypdf processing
        temp_filename = f"temp_{uuid.uuid4()}.pdf"
        temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)

        try:
            with open(temp_filepath, "wb") as f:
                f.write(file_bytes)

            # Extract text
            extracted_text = pdf_service.extract_text_from_pdf(temp_filepath)
            
            # Preview first 1500 characters
            preview_text = extracted_text[:1500]

            return {
                "report_id": report_id,
                "preview": preview_text
            }, 200

        finally:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                try:
                    os.remove(temp_filepath)
                except Exception:
                    pass

    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to generate report preview: {str(e)}"
        }, 500
