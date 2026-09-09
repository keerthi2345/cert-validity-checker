import re

def extract_generic_fields(reconstructed_text, raw_text, words, image_width=1000):
    """Fallback extractor: generic LABEL: VALUE pattern matching, line by line."""
    fields = {}

    lines = reconstructed_text.split("\n")
    pattern = r"^([A-Z][A-Z\s]{2,30})\s*[:;]\s*(.+)$"

    for line in lines:
        line = line.strip()
        if not line:
            continue
        match = re.match(pattern, line)
        if match:
            label = match.group(1).strip().lower().replace(" ", "_")
            value = match.group(2).strip()
            if value and len(value) <= 60:
                fields[label] = value

    return fields

def validate_generic_fields(fields):
    """No specific cross-field logic for unknown document types."""
    return {
        "validation_available": False,
        "note": "No dedicated validation rules exist for this document type."
    }