# utils.py

from datetime import date, timedelta

def get_next_weekday(current_date: date) -> date:
    """
    주말(토/일)을 건너뛰고 다음 영업일 날짜를 계산하여 반환합니다.
    (월요일=0, 일요일=6)
    """
    weekday_index = current_date.weekday()
    
    # 금요일(4)에 생성하면, 다음 영업일은 3일 뒤(월요일)
    if weekday_index == 4:
        days_to_add = 3
    # 토요일(5)에 생성하면, 다음 영업일은 2일 뒤(월요일)
    elif weekday_index == 5:
        days_to_add = 2
    # 그 외 요일(월~목, 일요일)은 1일 뒤
    else:
        days_to_add = 1
        
    return current_date + timedelta(days=days_to_add)