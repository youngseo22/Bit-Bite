from pydantic import BaseModel
import enum
from datetime import datetime

# models.py에 있는 StudyField Enum을 여기에서도 사용
class StudyField(str, enum.Enum):
    AI = "인공지능"
    CLOUD = "클라우드"
    CS = "컴퓨터공학"

# --- 구독자(Subscriber) 스키마 ---

# 1. 구독자 생성 시 (API 입력) 받을 데이터 모양
class SubscriberCreate(BaseModel):
    email: str
    field: StudyField 
    # 분야는 선택이 꼭 하나였던가 (개수 제한 뭐였지)

# 2. 구독자 정보 응답 시 (API 출력) 보낼 데이터 모양
class Subscriber(SubscriberCreate):
    id: int
    subscribed_at: datetime

    # 이 설정이 Pydantic 모델이 SQLAlchemy 모델(ORM)과
    # 자동으로 데이터를 주고받게 해줍니다. (필수!)
    class Config:
        orm_mode = True


# --- 질문(Question) 스키마 ---

class QuestionCreate(BaseModel):
    content: str
    field: StudyField | None = None

class Question(QuestionCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True