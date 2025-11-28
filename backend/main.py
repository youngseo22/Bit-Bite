import random
from datetime import datetime, date
from typing import List

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import redis
from sqlalchemy.orm import Session

import models, schemas
from database import engine, SessionLocal
from email_utils import send_verification_code, send_daily_question
from services import (
    analyze_and_feedback, 
    generate_new_question_for_all_tracks, 
    get_question_by_id
)

load_dotenv()

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine) 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# === Redis 연결 ===
# 우분투 VM 안에서 도커로 띄운 Redis(localhost:6379)에 접속
# decode_responses=True: 이걸 해야 b'1234'가 아니라 그냥 '1234' 문자열로 나옵니다.

try:
    rd = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
    rd.ping() # 연결 테스트
    print("✅ Redis 연결 성공!")
except:
    print("❌ Redis 연결 실패! (도커가 켜져 있는지 확인하세요)")

# DB 세션 의존성 주입 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# === API 엔드포인트 ===

@app.post("/email/request-verification")
def request_verification(
    req: schemas.EmailRequest, 
    background_tasks: BackgroundTasks,
    db = SessionLocal()
    ):
    # 1. 이미 구독한 이메일인지 DB 체크 
    existing_sub = db.query(models.Subscriber).filter(models.Subscriber.email == req.email).first()

    if existing_sub:
        raise HTTPException(status_code=400, detail="이미 구독 중인 이메일입니다.")
    
    # 2. 인증번호 6자리 생성 (1000 ~ 999999)
    verification_code = str(random.randint(1000, 999999))
    
    # 3. Redis에 저장 (Key: 이메일, Value: 인증번호) - 5분 유효
    rd.set(name=req.email, value=verification_code, ex=300)

    # 4. 백그라운드로 이메일 발송
    background_tasks.add_task(
        send_verification_code, 
        req.email, 
        verification_code
    )
    
    # 5. 이메일 발송 함수를 호출
    print(f"📧 [발송 요청] {req.email}")
    
    return {"message": "인증번호가 전송되었습니다. 이메일을 확인해주세요."}


@app.post("/email/verify-code")
def verify_code(req: schemas.EmailVerify):
    saved_code = rd.get(req.email)
    
    if not saved_code:
        raise HTTPException(status_code=400, detail="인증번호가 만료되었거나 없습니다.")
    
    if saved_code != req.code:
        raise HTTPException(status_code=400, detail="인증번호가 틀렸습니다.")
    
    # 4. Redis에 인증 성공 증표 남기기 (10분 유지)
    rd.set(name=f"verified:{req.email}", value="true", ex=600) 
    
    # 인증번호는 썼으니 삭제
    rd.delete(req.email)
    
    return {"message": "이메일 인증 성공! 이제 분야를 선택해주세요."}

@app.post("/subscribe", response_model=schemas.SubscriberResponse)
def subscribe(req: schemas.SubscriberCreate, db: Session = Depends(get_db)):
    # Redis에서 증표 확인
    is_verified = rd.get(f"verified:{req.email}")
    
    if not is_verified:
        raise HTTPException(status_code=401, detail="이메일 인증이 완료되지 않았습니다.")

    if db.query(models.Subscriber).filter(models.Subscriber.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 구독 중입니다.")

    # Enum 변환 및 저장
    model_field = models.StudyField[req.field.name]
    
    new_sub = models.Subscriber(
        email=req.email,
        field=model_field
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    
    # 증표 삭제 (재사용 방지)
    rd.delete(f"verified:{req.email}")
    
    return new_sub

# === AI API: 1. 질문 생성 (스케줄러/CronJob 호출용) ===
@app.post("/generate-question")
async def handle_question_generation(db: Session = Depends(get_db)):
    """평일 오전 8시에 호출되어 AI 질문을 생성하고 DB에 저장합니다."""
    # 동기 DB 세션을 services.py의 async 함수에 전달
    await generate_new_question_for_all_tracks(db) 
    return {"message": "Daily questions generation initiated successfully."}


# === AI API: 2. 답변 제출 및 피드백 (사용자 요청) ===
@app.post("/feedback", response_model=schemas.FeedbackResult)
async def submit_answer(
    submission: schemas.AnswerSubmission, 
    db: Session = Depends(get_db) 
):
    """
    사용자 답변을 받아 question_id로 DB에서 질문을 조회 후, 
    AI 분석을 요청하고 실시간 피드백을 JSON으로 반환합니다.
    """
    
    # 1. question_id로 DB에서 질문 조회
    # (services.py에 정의된 동기 함수 호출)
    question_obj = get_question_by_id(db, submission.question_id)
    
    # 2. AI 분석 및 피드백 함수 호출
    # (조회된 질문 내용과 분야, 그리고 사용자 답변을 전달)
    feedback = await analyze_and_feedback(
        question_text=question_obj.content,
        field=question_obj.field,
        user_answer=submission.user_answer
    )
    
    return feedback

# === AI API: 3. 질문 ID 조회 (사용자 요청) ===
@app.get("/questions/{question_id}", response_model=schemas.Question)
def read_question(question_id: int, db: Session = Depends(get_db)):
    """ID로 AI 질문 내용을 조회합니다."""
    # services.py에서 정의한 함수를 사용하여 DB 접근
    question = get_question_by_id(db, question_id)
    
    return question

# === scheduler API : 1. 질문 삭제 === : 매월 마지막 날 실행
@app.delete("/delete-old-questions")
async def delete_old_questions(db: Session = Depends(get_db)):
    today = date.today()
    current_year = today.year
    current_month = today.month

    start_of_month = today.replace(day=1)

    if current_month == 12:
        start_of_next_month = date(current_year + 1, 1, 1)
    else:
        start_of_next_month = today.replace(month=current_month + 1, day=1)
    
    deleted_count = db.query(models.Question).filter(
        models.Question.daily_question_date >= start_of_month,
        models.Question.daily_question_date < start_of_next_month
    ).delete()
    
    db.commit()
    
    month_display = f"{current_year}년 {current_month}월"
    return {"message": f"{month_display}에 해당하는 질문 {deleted_count}개가 삭제되었습니다."}


# === scheduler API : 2. 구독자에게 질문 이메일 발송 === : 매일 오전 8시 발송 
@app.post("/send-daily-questions")
async def send_daily_questions(
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    today_date = datetime.now().date()
    subscribers = db.query(models.Subscriber).all()
    sent_count = 0
    
    for sub in subscribers: 
        question = db.query(models.Question).filter(
            models.Question.field == sub.field,
            models.Question.daily_question_date == today_date
        ).first()
        
        if question: 
            question_content_for_email = question.content
            background_tasks.add_task(
                send_daily_question,           
                sub.email,                     
                question_content_for_email     # 이메일 내용 (질문 내용)
            )
            
            sent_count += 1
            print(f"📧 [질문 발송 예약] {sub.email} ({sub.field})")
    
    return {"message": f"총 {sent_count}명의 구독자에게 오늘의 질문 발송을 예약했습니다."}


# === 기본 루트 API ===
@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공"}


# === 구독자 목록 조회 API (관리자용) ===
@app.get("/subscribers", response_model=List[schemas.SubscriberResponse])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = db.query(models.Subscriber).offset(skip).limit(limit).all()
    return subscribers