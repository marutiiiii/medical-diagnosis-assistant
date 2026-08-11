import os
from database.supabase_client import get_supabase_client

BUCKET_NAME = "medical-reports"

def upload_file(file_bytes: bytes, storage_path: str, content_type: str = "application/pdf") -> str:
    """
    Uploads file bytes to Supabase Storage in the 'medical-reports' bucket.

    Args:
        file_bytes: The file contents in bytes.
        storage_path: The destination path in the bucket (e.g. 'user_id/filename.pdf').
        content_type: The MIME type of the file.

    Returns:
        The public URL of the uploaded file.
    """
    supabase = get_supabase_client()
    
    # Upload to Supabase Storage
    # The file_options dict allows specifying content-type
    supabase.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type}
    )
    
    # Retrieve public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
    return public_url.rstrip("?")


def download_file(storage_path: str) -> bytes:
    """
    Downloads file bytes from Supabase Storage 'medical-reports' bucket.

    Args:
        storage_path: The file path in the bucket.

    Returns:
        The downloaded file bytes.
    """
    supabase = get_supabase_client()
    return supabase.storage.from_(BUCKET_NAME).download(storage_path)


def delete_file(storage_path: str) -> bool:
    """
    Deletes a file from Supabase Storage 'medical-reports' bucket.

    Args:
        storage_path: The file path in the bucket.

    Returns:
        True if deletion was successful.
    """
    supabase = get_supabase_client()
    supabase.storage.from_(BUCKET_NAME).remove([storage_path])
    return True


def get_storage_path_from_url(file_url: str) -> str:
    """
    Helper function to extract the relative storage path from a file URL.

    Example:
        https://.../storage/v1/object/public/medical-reports/user_id/file.pdf -> user_id/file.pdf
    """
    marker = f"{BUCKET_NAME}/"
    parts = file_url.split(marker)
    if len(parts) > 1:
        # Strip any query parameters just in case
        return parts[1].split("?")[0]
    return file_url
