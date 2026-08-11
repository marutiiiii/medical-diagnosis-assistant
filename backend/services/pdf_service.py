from pypdf import PdfReader

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from all pages of a PDF file, merges it, removes empty lines,
    and returns a cleaned text string.

    Args:
        file_path: The absolute or relative path to the PDF file on the local filesystem.

    Returns:
        The extracted and cleaned text content.
    """
    reader = PdfReader(file_path)
    text_content = []
    
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_content.append(text)
            
    # Merge pages
    full_text = "\n".join(text_content)
    
    # Remove empty lines and clean leading/trailing whitespace
    clean_lines = [line.strip() for line in full_text.splitlines() if line.strip()]
    
    return "\n".join(clean_lines)
