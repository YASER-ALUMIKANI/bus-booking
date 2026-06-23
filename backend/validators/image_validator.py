import logging
from PIL import Image

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

DANGEROUS_EXTENSIONS = {
    "php", "php3", "php4", "php5", "phtml", "phar",
    "asp", "aspx", "asa", "asax",
    "jsp", "jspx",
    "py", "rb", "pl", "sh", "bash", "cgi",
    "exe", "dll", "bat", "cmd", "ps1",
    "htaccess", "htpasswd",
    "svg", "xml", "html", "htm",  # can contain scripts
}

IMAGE_MAGIC = {
    "jpg":  [(0, b"\xff\xd8\xff")],
    "jpeg": [(0, b"\xff\xd8\xff")],
    "png":  [(0, b"\x89PNG\r\n\x1a\n")],
    "webp": [(0, b"RIFF"), (8, b"WEBP")],
}

def allowed_image_filename(filename: str) -> bool:
    if not isinstance(filename, str) or "." not in filename:
        return False
    parts = filename.lower().split(".")
    # Reject double extensions containing dangerous keywords
    for segment in parts[:-1]:
        if segment in DANGEROUS_EXTENSIONS:
            return False
    extension = parts[-1]
    return extension in ALLOWED_IMAGE_EXTENSIONS

def verify_image_magic(file_storage) -> bool:
    """Uses PIL to open and verify the image contents and boundaries."""
    try:
        # Save current position
        pos = file_storage.stream.tell()
    except Exception:
        pos = 0
    try:
        # PIL open and verify
        img = Image.open(file_storage.stream)
        img.verify()
        
        # Seek back and reopen to check size
        file_storage.stream.seek(pos)
        img = Image.open(file_storage.stream)
        if img.width > 5000 or img.height > 5000:
            file_storage.stream.seek(pos)
            return False
            
        file_storage.stream.seek(pos)
        return True
    except Exception:
        try:
            file_storage.stream.seek(pos)
        except Exception:
            pass
        return False
