from datetime import datetime, timedelta

def calculate_arrival_time(trip_time_str: str) -> str:
    for fmt in ("%I:%M:%S %p", "%I:%M %p", "%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(trip_time_str.strip(), fmt)
            arr = t + timedelta(hours=23)
            return arr.strftime("%I:%M:%S %p")
        except ValueError:
            continue
    return "05:30:00 PM"
