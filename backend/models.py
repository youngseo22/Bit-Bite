import enum 
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, func
from sqlalchemy.sql.schema import ForeignKey

# database.py에서 만든 Base 클래스를 가져옵니다.
from database import Base

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())