from pydantic import BaseModel, EmailStr
from datetime import datetime
import enum

# models.py에 있는 StudyField Enum을 여기에서도 사용
class StudyField(str, enum.Enum):
    AI = "인공지능"
    CLOUD = "클라우드"
    CS = "컴퓨터공학"

# --- 구독자(Subscriber) 스키마 ---

class EmailRequest(BaseModel): #  인증번호 요청
    email: EmailStr

class EmailVerify(BaseModel): #  인증번호 검증
    email: EmailStr
    code: str

class SubscriberCreate(BaseModel): # 구독자 생성
    email: EmailStr
    field: StudyField              # 선택 안하는 경우는 없음 

class SubscriberResponse(BaseModel):  # 구독자 응답
    id: int
    email: str
    field: StudyField
    subscribed_at: datetime

    class Config:
        orm_mode = True


# --- 질문(Question) 스키마 ---

class QuestionCreate(BaseModel):
    content: str
    field: StudyField

class Question(QuestionCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True