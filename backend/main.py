from dotenv import load_dotenv
load_dotenv()
from services import generate_new_question_for_all_tracks, analyze_and_feedback, get_question_by_id
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import select, extract
from typing import List
import redis
import random
import models, schemas 
from database import engine, SessionLocal 
from email_utils import send_verification_code
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone, date, time
from jose import JWTError, jwt
from utils import get_next_weekday
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="adminLogin")

# JWT 설정 (환경 변수에서 값 로드)
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES는 문자열이므로 정수로 변환, 기본값은 30분
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)) 

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

# === JWT 토큰 생성 함수 ===
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """주어진 데이터로 JWT 토큰을 생성합니다."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_initial_admin(db: Session):
    """DB에 'admin' 계정이 없으면 'admin'/'010101' 계정을 생성합니다."""
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    
    if not admin_user:
        # models.py의 변경 사항으로 인해, 여기서 반환되는 것은 일반 텍스트 '010101'입니다.
        password = models.User.create_password("010101")
        
        initial_admin = models.User(
            username="admin",
            # ⬇️⬇️ 필드 이름을 'password'로 변경합니다. ⬇️⬇️
            password=password, 
            # ⬆️⬆️
            is_admin=True
        )
        db.add(initial_admin)
        db.commit()
        return True
    return False

# 1. 현재 사용자 조회 함수 (JWT 토큰 디코딩)
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

# 2. 관리자 권한 확인 의존성 함수
def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    """현재 로그인된 사용자가 관리자인지 확인합니다."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return current_user

@app.on_event("startup")
def on_startup():
    """서버가 시작된 후, 단 한 번 관리자 계정 초기화를 시도합니다."""
    try:
        for db_session in get_db():
            # main.py에 정의된 create_initial_admin 함수 호출
            if create_initial_admin(db_session): 
                print("✅ [관리자] 초기 계정 'admin'이 생성되었습니다.")
            else:
                print("✅ [관리자] 계정 'admin'이 이미 존재합니다.")
            break
    except Exception as e:
        print(f"❌ [관리자] 계정 생성 중 오류 발생: {e}")

# === API 엔드포인트 ===

@app.get("/admin/questions/month", response_model=List[schemas.QuestionResponse], tags=["Admin"])
def get_monthly_questions(
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    [관리자 전용] 현재 달에 스케줄된 모든 질문 목록을 조회합니다.
    """
    today = date.today()
    current_month = today.month
    current_year = today.year

    # SQLAlchemy v2.0 스타일: 월과 연도를 추출하여 필터링
    stmt = select(models.Question).where(
        extract('month', models.Question.daily_question_date) == current_month,
        extract('year', models.Question.daily_question_date) == current_year
    )
    
    questions = db.execute(stmt).scalars().all()
    
    return questions

def check_modification_window(scheduled_date: date):
    now = datetime.now() 
    today = now.date()
    
    # 1. 현재 시각 기준, '수정해야 할' 질문 날짜(Expected Date) 결정
    
    # 07:30 AM 이전: 오늘 날짜가 다음 영업일인 경우, 오늘 질문이 수정 대상
    if now.time() < time(7, 30):
        # 예: 월요일 7:20 AM -> 월요일 질문 수정 가능
        # 예: 일요일 7:20 AM -> (현재 로직에서는 발생하지 않음. 주말은 영업일이 아님)
        expected_modifiable_date = today
    # 07:30 AM 이후: 다음 영업일 질문이 수정 대상 (새 윈도우 시작)
    else:
        # 예: 금요일 08:00 AM -> 다음 주 월요일 질문이 수정 대상
        # 예: 월요일 08:00 AM -> 화요일 질문이 수정 대상
        expected_modifiable_date = get_next_weekday(today) 

    # 1A. 수정하려는 질문의 날짜가 현재 시각에 허용된 대상인지 확인
    if scheduled_date != expected_modifiable_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"현재 시각 ({now.strftime('%H:%M')})에 수정 가능한 질문은 {expected_modifiable_date} 질문뿐입니다."
        )

    # 2. 수정 시간 윈도우 정의 (주말 확장 로직 적용)
    
    # 질문이 월요일(0)에 스케줄된 경우: 윈도우 시작은 직전 금요일 8:00 AM
    if scheduled_date.weekday() == 0:
        # 월요일 질문의 시작일은 3일 전인 금요일
        window_start_date = scheduled_date - timedelta(days=3) 
    # 질문이 화~금에 스케줄된 경우: 윈도우 시작은 직전 영업일 8:00 AM
    else:
        # 화요일 질문의 시작일은 1일 전인 월요일
        window_start_date = scheduled_date - timedelta(days=1)
        
    # 윈도우 시작: 시작 날짜 8:00 AM
    window_start = datetime.combine(window_start_date, time(8, 0))
    # 윈도우 종료: 질문 당일 7:30 AM
    window_end = datetime.combine(scheduled_date, time(7, 30))

    # 3. 현재 시각이 윈도우 안에 있는지 확인
    if not (window_start <= now <= window_end):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"질문 수정 가능 시간이 아닙니다. 수정 가능 시간: {window_start.strftime('%Y-%m-%d %H:%M')} ~ {window_end.strftime('%Y-%m-%d %H:%M')}"
        )
    # 윈도우 내에 있으면 통과

@app.put("/admin/questions/next-day/{question_id}", tags=["Admin"])
def modify_next_day_question(
    question_id: int,
    modification: schemas.QuestionModify,
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    [관리자 전용] 다음날 질문(오전 8시 ~ 익일 오전 7시 30분 윈도우)의 내용을 수정합니다.
    """
    # 1. 질문 조회 
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="질문을 찾을 수 없습니다.")

    # 2. 시간 및 날짜 제약 조건 확인
    check_modification_window(question.daily_question_date) 

    # 3. 수정 적용
    question.content = modification.new_content
    db.commit()
    db.refresh(question)
    
    return {"message": f"질문 #{question.id} 내용이 성공적으로 수정되었습니다."}

# === 0. 관리자 로그인 API ===
@app.post("/adminLogin", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), # ID/PW를 Form 데이터로 받음
    db: Session = Depends(get_db)
):
    """관리자 로그인 및 JWT 토큰 발급"""
    # 1. DB에서 사용자 조회
    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()

    # 2. 사용자 없거나 비밀번호 불일치 확인
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. 관리자 권한 확인
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for admin access")

    # 4. JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token}

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
async def submit_answer(
    submission: schemas.AnswerSubmission, 
    db: Session = Depends(get_db) # DB 세션 주입 추가
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


# 기본 루트 API (그대로 둡니다)
@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공"}


# === 구독자 목록 조회 API (관리자용) ===
@app.get("/subscribers", response_model=List[schemas.SubscriberResponse])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = db.query(models.Subscriber).offset(skip).limit(limit).all()
    return subscribers