import re
from datetime import datetime

VALID_COMPANIES = {"البركة", "المتصدر", "البراق", "إكسبرس"}
VALID_CITIES = {"البيضاء", "صنعاء", "عدن", "تعز", "الحديدة", "ذمار", "الرياض", "جدة", "الدمام", "أبها", "مكة", "إب", "نجران"}

def validate_passenger_name(name: str) -> bool:
    if not isinstance(name, str):
        return False
    name = name.strip()
    if len(name) < 3 or len(name) > 100:
        return False
    return bool(re.fullmatch(r"^[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]+$", name))

def validate_passport(passport: str) -> bool:
    if not isinstance(passport, str):
        return False
    passport = passport.strip()
    return bool(re.fullmatch(r"^[A-Za-z0-9-]{5,20}$", passport))

def validate_travel_date(value: str) -> bool:
    if not isinstance(value, str):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False

def validate_company(company: str) -> bool:
    return isinstance(company, str) and company.strip() in VALID_COMPANIES

def validate_city(city: str) -> bool:
    return isinstance(city, str) and city.strip() in VALID_CITIES
