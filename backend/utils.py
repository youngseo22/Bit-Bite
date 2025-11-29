from datetime import date, timedelta

def get_next_weekday(d: date) -> date:
    """
    주어진 날짜(d)를 기준으로 다음 평일 날짜 반환
    - 금요일(4) -> 월요일 (+3일)
    - 토요일(5) -> 월요일 (+2일)
    - 그 외   -> 다음날 (+1일)
    """
    weekday = d.weekday()
    
    if weekday == 4:
        return d + timedelta(days=3)
    elif weekday == 5:
        return d + timedelta(days=2)
    else:           
        return d + timedelta(days=1)