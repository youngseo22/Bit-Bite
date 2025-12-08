from datetime import date, timedelta

# 주어진 날짜(d)를 기준으로 다음 평일 날짜 반환
def get_next_weekday(d: date) -> date:
    weekday = d.weekday()
    
    if weekday == 4:
        return d + timedelta(days=3)
    elif weekday == 5:
        return d + timedelta(days=2)
    else:           
        return d + timedelta(days=1)