import enum 
from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Text, func, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String(256), nullable=False) 
    is_admin = Column(Boolean, default=False)
    @classmethod
    def create_password(cls, password: str):
        return password 

    def verify_password(self, input_password: str):
        return input_password == self.password

# 'StudyField' Domain을 파이썬 Enum으로 정의
class StudyField(enum.Enum):
    AI = "인공지능"
    CLOUD = "클라우드"
    CS = "컴퓨터공학"

# 구독자(subscribers) 테이블 모델
class Subscriber(Base):
    __tablename__ = "subscribers" # 테이블 이름

    id = Column(Integer, primary_key=True, index=True) 
    email = Column(String, unique=True, index=True, nullable=False)
    field = Column(Enum(StudyField, values_callable=lambda obj: [e.value for e in obj]))
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())

# 질문(questions) 테이블 모델
class Question(Base):
    __tablename__ = "questions" 

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    field = Column(Enum(StudyField, values_callable=lambda obj: [e.value for e in obj]))
    daily_question_date = Column(Date, index=True, nullable=False)