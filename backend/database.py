import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT")
DB_NAME = os.environ.get("DB_NAME")

# 1. DB 접속 주소 (PostgreSQL 용)
SQLALCHEMY_DATABASE_URL = (f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

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