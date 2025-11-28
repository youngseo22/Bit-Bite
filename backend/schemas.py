from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
import enum

# models.py에 있는 StudyField Enum을 여기에서도 사용
class StudyField(str, enum.Enum):
    AI = "인공지능"
    CLOUD = "클라우드"
    CS = "컴퓨터공학"

class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    """사용자 정보 응답 스키마"""
    id: int
    username: str
    is_admin: bool

    class Config:
        orm_mode = True

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
    daily_question_date: date

    class Config:
        orm_mode = True

# 질문 응답 스키마 (GET /admin/questions/month 응답용)
class QuestionResponse(BaseModel):
    id: int
    content: str
    field: StudyField # StudyField Enum 사용
    daily_question_date: date # models.py의 필드 이름과 일치

    class Config:
        from_attributes = True # Pydantic v2 호환 (orm_mode 대신)

# 질문 수정 요청 스키마 (PUT /admin/questions/next-day/{id} 입력용)
class QuestionModify(BaseModel):
    new_content: str

# --- 답변 제출(AnswerSubmission) 스키마 ---
class AnswerSubmission(BaseModel):
    question_id: int 
    user_answer: str

# --- 피드백(Feedback) 스키마 ---
class FeedbackResult(BaseModel):
    score: int = Field(..., ge=0, le=100, description="면접관 AI가 부여한 0에서 100 사이의 점수")
    model_answer: str             # 모범 답안
    well_done: list[str]          # 잘된 점
    improvements: list[str]       # 개선할 점
    additional_content: list[str] # 추가하면 좋은 내용