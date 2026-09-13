import exifread
import pikepdf
import os

def analyze_image_metadata(image_path):
    """Reads EXIF metadata from an image — flags known editing-software tags."""
    with open(image_path, "rb") as f:
        tags = exifread.process_file(f)

    software = str(tags.get("Image Software", ""))
    editing_tools = ["photoshop", "gimp", "snapseed", "lightroom", "pixlr"]

    return {
        "software": software,
        "suspicious": any(tool in software.lower() for tool in editing_tools),
    }

def analyze_pdf_metadata(pdf_path):
    """Reads PDF document info — flags a mismatch between creation and modification dates."""
    with pikepdf.open(pdf_path) as pdf:
        info = pdf.docinfo
        creator = str(info.get("/Creator", ""))
        producer = str(info.get("/Producer", ""))
        creation_date = str(info.get("/CreationDate", ""))
        mod_date = str(info.get("/ModDate", ""))

    modified_after_creation = bool(mod_date) and mod_date != creation_date

    return {
        "creator": creator,
        "producer": producer,
        "creation_date": creation_date,
        "mod_date": mod_date,
        "modified_after_creation": modified_after_creation,
    }

def analyze_metadata(file_path):
    """Routes to the right checker based on file type."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return analyze_pdf_metadata(file_path)
    return analyze_image_metadata(file_path)