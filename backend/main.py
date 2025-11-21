from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import redis
import random
import models, schemas 
from database import engine, SessionLocal 

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine) 

app = FastAPI()

# === Redis 연결 ===
# 우분투 VM 안에서 도커로 띄운 Redis(localhost:6379)에 접속
# decode_responses=True: 이걸 해야 b'1234'가 아니라 그냥 '1234' 문자열로 나옵니다.
# rd = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

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
def request_verification(req: schemas.EmailRequest):
    # 1. 이미 구독한 이메일인지 DB 체크 (우선 생략)
    
    # 2. 인증번호 6자리 생성 (1000 ~ 999999)
    verification_code = str(random.randint(1000, 999999))
    
    # 3. Redis에 저장 (Key: 이메일, Value: 인증번호) - 5분 유효
    rd.set(name=req.email, value=verification_code, ex=300)
    
    # 4. 이메일 발송 함수를 호출
    print(f"📧 [전송됨] {req.email}의 인증번호: {verification_code}")
    
    return {"message": "인증번호가 전송되었습니다. (콘솔 확인)"}


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


# 기본 루트 API (그대로 둡니다)
@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공"}


# === 구독자 목록 조회 API (관리자용) ===
@app.get("/subscribers", response_model=List[schemas.SubscriberResponse])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = db.query(models.Subscriber).offset(skip).limit(limit).all()
    return subscribers