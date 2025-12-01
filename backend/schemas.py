from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
import enum

class StudyField(str, enum.Enum):
    AI = "인공지능"
    CLOUD = "클라우드"
    CS = "컴퓨터공학"

# JWT 토큰 응답 스키마
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# 사용자 정보 응답 스키마
class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool

    class Config:
        orm_mode = True

# 구독자 스키마
class EmailRequest(BaseModel):
    email: EmailStr

class EmailVerify(BaseModel):
    email: EmailStr
    code: str

class SubscriberCreate(BaseModel):
    email: EmailStr
    field: StudyField

class SubscriberResponse(BaseModel):
    id: int
    email: str
    field: StudyField
    subscribed_at: datetime

    class Config:
        orm_mode = True

# 질문 스키마
class QuestionCreate(BaseModel):
    content: str
    field: StudyField

class Question(QuestionCreate):
    id: int
    daily_question_date: date

    class Config:
        orm_mode = True

# 이달의 질문 응답 스키마
class QuestionResponse(BaseModel):
    id: int
    content: str
    field: StudyField
    daily_question_date: date

    class Config:
        from_attributes = True

# 내일의 질문 수정 요청 스키마
class QuestionModify(BaseModel):
    new_content: str

# 피드백 스키마
class AnswerSubmission(BaseModel):
    question_id: int 
    user_answer: str

class FeedbackResult(BaseModel):
    score: int = Field(..., ge=0, le=100, description="면접관 AI가 부여한 0에서 100 사이의 점수")
    model_answer: str
    well_done: list[str]
    improvements: list[str]
    additional_content: list[str]