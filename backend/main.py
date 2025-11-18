from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

# 우리가 만든 모듈들
import models
import schemas # schemas.py
from database import engine, SessionLocal 

# 2. models.py에 정의된 모든 테이블을 실제 SQLite DB(Postgres DB)에 생성
models.Base.metadata.create_all(bind=engine) 

# 3. FastAPI 앱 인스턴스 생성
app = FastAPI()

# --- DB 세션 의존성 주입 ---
# 이 함수가 API 요청이 올 때마다 SessionLocal()을 호출해
# 독립적인 DB 세션을 생성하고, API 처리가 끝나면 닫아줍니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# === API 엔드포인트 ===

@app.post("/subscribers/", response_model=schemas.Subscriber)
def create_subscriber(
    subscriber: schemas.SubscriberCreate, # 1. 요청 Body는 SubscriberCreate 스키마를 따름
    db: Session = Depends(get_db)         # 2. get_db 함수를 통해 DB 세션을 주입받음
):
    # Pydantic(schemas) Enum을 SQLAlchemy(models) Enum으로 변환합니다.
    
    model_field_enum = None
    if subscriber.field:
        # 1. subscriber.field는 schemas.StudyField.BACKEND 객체입니다.
        # 2. .name을 쓰면 이 객체의 '키' (이름)인 "BACKEND" 문자열을 뽑아옵니다.
        field_key = subscriber.field.name 
        
        # 3. 그 "BACKEND" 문자열로 models.StudyField["BACKEND"]를 찾아
        #    SQLAlchemy가 알아듣는 models.StudyField.BACKEND 객체를 가져옵니다.
        model_field_enum = models.StudyField[field_key]
    

    # 3. 입력받은 Pydantic 모델(subscriber)을 SQLAlchemy 모델(db_subscriber)로 변환
    db_subscriber = models.Subscriber(
        email=subscriber.email, 
        field=subscriber.field
    )
    
    # 4. DB 세션에 추가 (아직 DB에 저장된 것 아님)
    db.add(db_subscriber)
    
    # 5. DB에 최종 저장 (Commit)
    db.commit()
    
    # 6. DB에 저장된 최신 데이터를 (id, subscribed_at 포함) 다시 읽어옴
    db.refresh(db_subscriber)
    
    # 7. 생성된 SQLAlchemy 모델 객체를 반환 (FastAPI가 JSON으로 변환)
    return db_subscriber


# 기본 루트 API (그대로 둡니다)
@app.get("/")
def read_root():
    return {"Status": "DB 연결 성공 (SQLite)"}