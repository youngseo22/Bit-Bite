from dotenv import load_dotenv
load_dotenv()
from services import generate_new_question_for_all_tracks, analyze_and_feedback
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import redis
import random
import models, schemas 
from database import engine, SessionLocal 
from email_utils import send_verification_code
from fastapi.middleware.cors import CORSMiddleware

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine) 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# === Redis 연결 ===
# 우분투 VM 안에서 도커로 띄운 Redis(localhost:6379)에 접속
# decode_responses=True: 이걸 해야 b'1234'가 아니라 그냥 '1234' 문자열로 나옵니다.

try:
    rd = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
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
    background_tasks: BackgroundTasks # 백그라운드 실행 도구
    ):
    # 1. 이미 구독한 이메일인지 DB 체크 (우선 생략)
    
    # 2. 인증번호 6자리 생성 (1000 ~ 999999)
    verification_code = str(random.randint(1000, 999999))
    
    # 3. Redis에 저장 (Key: 이메일, Value: 인증번호) - 5분 유효
    rd.set(name=req.email, value=verification_code, ex=300)

    # 4. 백그라운드로 이메일 발송 작업 추가
    background_tasks.add_task(
        send_verification_code, 
        req.email, 
        verification_code
    )
    
    # 5. 이메일 발송 함수를 호출
    print(f"📧 {req.email}의 인증번호: {verification_code}")
    print(f"📧 [발송 요청] {req.email} (백그라운드 작업 등록됨)")
    
    return {"message": "인증번호가 전송되었습니다. 이메일을 확인해주세요."}


@app.post("/email/verify-code")
def verify_code(req: schemas.EmailVerify):
    # 1. Redis에서 해당 이메일의 코드 가져오기
    saved_code = rd.get(req.email)
    
    # 2. 코드가 없으면 (시간 초과)
    if not saved_code:
        raise HTTPException(status_code=400, detail="인증번호가 만료되었거나 없습니다.")
    
    # 3. 코드 불일치
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
async def submit_answer(submission: schemas.AnswerSubmission):
    """사용자 답변을 받아 AI 분석 후 실시간 피드백을 JSON으로 반환합니다."""
    # 이 함수는 DB 접근이 불필요하므로 DB 세션을 주입하지 않습니다.
    feedback = await analyze_and_feedback(submission)
    return feedback


# 기본 루트 API (그대로 둡니다)
@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공"}


# === 구독자 목록 조회 API (관리자용) ===
@app.get("/subscribers", response_model=List[schemas.SubscriberResponse])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = db.query(models.Subscriber).offset(skip).limit(limit).all()
    return subscribers