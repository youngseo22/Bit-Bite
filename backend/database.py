from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. DB 접속 주소 (PostgreSQL 용)
# 형식: "postgresql://[사용자이름]:[비밀번호]@[호스트주소]:[포트번호]/[DB이름]"
# 도커에 PostgressSQL 다운받아 사용
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:bitbite@localhost:5432/postgres"

# 2. DB 접속 엔진 생성
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. DB와 통신할 세션(Session) 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. DB 모델을 만들 때 사용할 기본 클래스
Base = declarative_base()


# # PostgreSQL 사용 전 임시로 SQLite 사용
# # 1. DB 접속 주소 (SQLite 용)
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# # 2. DB 접속 엔진 생성 (SQLite는 이 옵션이 필요합니다)
# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )

# # 3. DB와 통신할 세션 생성
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # 4. DB 모델을 만들 때 사용할 기본 클래스
# Base = declarative_base()