import re

def validate_phone(phone: str) -> bool:
    if not isinstance(phone, str):
        return False
    phone = phone.strip()
    return bool(re.fullmatch(r"^[0-9]{7,15}$", phone))

def validate_password(password: str) -> bool:
    return isinstance(password, str) and 6 <= len(password) <= 128
