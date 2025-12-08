import os
import random
from datetime import date, datetime, timedelta, time, timezone
from typing import List

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    BackgroundTasks, 
    Depends, 
    FastAPI, 
    HTTPException, 
    status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import redis
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

import models, schemas
from database import engine, SessionLocal
from email_utils import send_verification_code, send_daily_question
from services import analyze_and_feedback, generate_new_question_for_all_tracks, get_question_by_id
from utils import get_next_weekday

load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/adminLogin")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)) 

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine) 

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

try:
    redis_host = os.getenv("REDIS_HOST", "localhost")
    rd = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)
    rd.ping() # 연결 테스트
    print("Redis 연결에 성공하였습니다.")
except Exception as e:
    print(f"Redis 연결에 실패하였습니다. 오류: {e}")

router = APIRouter(prefix="/api")

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 주어진 데이터로 JWT 토큰을 생성
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# DB에 관리자 계정이 없을 때 계정 생성
def create_initial_admin(db: Session):
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    
    if not admin_user:
        password = models.User.create_password("010101")
        
        initial_admin = models.User(
            username="admin",
            password=password, 
            is_admin=True
        )
        db.add(initial_admin)
        db.commit()
        return True

    return False

# 현재 사용자 조회 (JWT 토큰 디코딩)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user

# 현재 로그인된 사용자가 관리자인지 확인
def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return current_user

# 서버가 시작된 후, 관리자 계정 초기화 시도
@app.on_event("startup")
def on_startup():
    try:
        for db_session in get_db():
            if create_initial_admin(db_session): print("[관리자] 초기 계정이 생성되었습니다.")
            else: print("[관리자] 계정이 이미 존재합니다.")
            break
    except Exception as e:
        print(f"[관리자] 계정 생성 중 오류가 발생했습니다. 오류: {e}")

# 현재 달에 스케줄된 모든 질문 목록을 조회 (관리자용)
@router.get("/admin/questions/month", response_model=List[schemas.QuestionResponse], tags=["Admin"])
def get_monthly_questions(db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    today = date.today()
    current_month = today.month
    current_year = today.year

    stmt = select(models.Question).where(
        extract('month', models.Question.daily_question_date) == current_month,
        extract('year', models.Question.daily_question_date) == current_year
    )
    
    questions = db.execute(stmt).scalars().all()
    return questions

# 질문 수정이 가능한지 확인
def check_modification_window(scheduled_date: date):
    now = datetime.now() 
    today = now.date()
    
    if now.time() < time(7, 30): expected_modifiable_date = today
    else: expected_modifiable_date = get_next_weekday(today) 

    if scheduled_date != expected_modifiable_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"현재 시각 ({now.strftime('%H:%M')})에 수정 가능한 질문은 {expected_modifiable_date} 질문뿐입니다."
        )

    if scheduled_date.weekday() == 0: window_start_date = scheduled_date - timedelta(days=3) 
    else: window_start_date = scheduled_date - timedelta(days=1)
    
    window_start = datetime.combine(window_start_date, time(8, 0))
    window_end = datetime.combine(scheduled_date, time(7, 30))

    if not (window_start <= now <= window_end):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"질문 수정 가능 시간이 아닙니다. 수정 가능 시간: {window_start.strftime('%Y-%m-%d %H:%M')} ~ {window_end.strftime('%Y-%m-%d %H:%M')}"
        )

# 다음날 질문 내용 수정 (관리자용)
@router.put("/admin/questions/next-day/{question_id}", tags=["Admin"])
def modify_next_day_question(
    question_id: int,
    modification: schemas.QuestionModify,
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="질문을 찾을 수 없습니다.")

    check_modification_window(question.daily_question_date) 

    question.content = modification.new_content
    db.commit()
    db.refresh(question)
    
    return {"message": f"질문 #{question.id} 내용이 성공적으로 수정되었습니다."}

# 관리자 로그인 및 JWT 토큰 발급
@router.post("/adminLogin", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()

    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for admin access")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token}

# 메일 인증번호 요청
@router.post("/email/request-verification")
def request_verification(
        req: schemas.EmailRequest, 
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
    ):

    existing_sub = db.query(models.Subscriber).filter(models.Subscriber.email == req.email).first()
    if existing_sub:
        raise HTTPException(status_code=400, detail="이미 구독 중인 이메일입니다.")
    
    verification_code = str(random.randint(1000, 999999))
    
    rd.set(name=req.email, value=verification_code, ex=300)

    background_tasks.add_task(
        send_verification_code, 
        req.email, 
        verification_code
    )
    
    return {"message": "인증번호가 전송되었습니다."}

# 메일 인증번호 확인
@router.post("/email/verify-code")
def verify_code(req: schemas.EmailVerify):
    saved_code = rd.get(req.email)
    
    if not saved_code:
        raise HTTPException(status_code=400, detail="인증번호가 만료되었거나 없습니다.")
    
    if saved_code != req.code:
        raise HTTPException(status_code=400, detail="인증번호가 틀렸습니다.")

    rd.set(name=f"verified:{req.email}", value="true", ex=600)     
    rd.delete(req.email)
    
    return {"message": "이메일 인증에 성공했습니다."}

# 새로운 구독자 등록
@router.post("/subscribe", response_model=schemas.SubscriberResponse)
def subscribe(req: schemas.SubscriberCreate, db: Session = Depends(get_db)):
    is_verified = rd.get(f"verified:{req.email}")
    
    if not is_verified:
        raise HTTPException(status_code=401, detail="이메일 인증이 완료되지 않았습니다.")

    if db.query(models.Subscriber).filter(models.Subscriber.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 구독 중입니다.")

    model_field = models.StudyField[req.field.name]
    
    new_sub = models.Subscriber(
        email=req.email,
        field=model_field
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    
    rd.delete(f"verified:{req.email}")
    return new_sub

# 사용자 답변을 받아 분석을 요청한 뒤 실시간 피드백 반환
@router.post("/feedback", response_model=schemas.FeedbackResult)
async def submit_answer(submission: schemas.AnswerSubmission, db: Session = Depends(get_db)):
    question_obj = get_question_by_id(db, submission.question_id)
    feedback = await analyze_and_feedback(
        question_text=question_obj.content,
        field=question_obj.field,
        user_answer=submission.user_answer
    )
    
    return feedback

# id를 통해 질문 조회
@router.get("/questions/{question_id}", response_model=schemas.Question)
def read_question(question_id: int, db: Session = Depends(get_db)):
    question = get_question_by_id(db, question_id)
    return question

# 매월 1일, 이전 달의 질문 삭제
@router.delete("/delete-old-questions")
async def delete_old_questions(db: Session = Depends(get_db)):
    today = date.today()
    start_of_current_month = today.replace(day=1)
    start_of_prev_month = (start_of_current_month - timedelta(days=1)).replace(day=1)
    
    deleted_count = db.query(models.Question).filter(
        models.Question.daily_question_date >= start_of_prev_month,
        models.Question.daily_question_date < start_of_current_month
    ).delete()
    
    db.commit()

    prev_year = start_of_prev_month.year
    prev_month = start_of_prev_month.month
    
    month_display = f"{prev_year}년 {prev_month}월"
    return {"message": f"{month_display}에 해당하는 질문 {deleted_count}개가 삭제되었습니다."}

# 평일 오전 8시, 내일 전송될 질문을 생성하고 DB에 저장 (스케줄러 호출)
@router.post("/generate-question")
async def handle_question_generation(db: Session = Depends(get_db)):
    await generate_new_question_for_all_tracks(db) 
    return {"message": "내일 전송될 질문이 성공적으로 생성되었습니다."}

# 평일 오전 8시, 구독자에게 질문 이메일 발송
@router.post("/send-daily-questions")
async def send_daily_questions(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
                question_content_for_email, 
                question.id
            )
            
            sent_count += 1
            print(f"[질문 발송 예약] {sub.email} ({sub.field})")
    
    return {"message": f"총 {sent_count}명의 구독자에게 오늘의 질문 발송을 예약했습니다."}

# 구독자 목록 조회 (관리자용)
@router.get("/subscribers", response_model=List[schemas.SubscriberResponse])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = db.query(models.Subscriber).offset(skip).limit(limit).all()
    return subscribers

@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공"}

app.include_router(router)