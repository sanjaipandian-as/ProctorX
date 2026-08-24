import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extracts text page-by-page from PDF binary data."""
    pages = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for idx, page in enumerate(doc):
            text = page.get_text()
            pages.append({
                "page": idx + 1,
                "text": text
            })
    return pages

def chunk_text(pages_list: list[dict], chunk_size: int = 800, overlap: int = 150) -> list[dict]:
    """Splits page-by-page text into overlapping chunks, maintaining page metadata."""
    chunks = []
    for page_obj in pages_list:
        page_num = page_obj["page"]
        text = page_obj["text"]
        
        if not text.strip():
            continue
            
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunks.append({
                "text": text[start:end],
                "page": page_num
            })
            start += chunk_size - overlap
    return chunks
