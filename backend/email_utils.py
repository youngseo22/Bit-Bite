import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# .env 파일 로딩 
load_dotenv()

# 1. 이메일 서버 설정 (Configuration)
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_USERNAME"),
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

# 2. 실제 이메일 발송 함수
async def send_verification_code(email_to: str, code: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #2c3e50;">Bit-Bite 인증번호</h2>
        <p>안녕하세요! 구독 신청을 위한 인증번호입니다.</p>
        <h1 style="color: #3498db; letter-spacing: 5px;">{code}</h1>
        <p>5분 안에 입력해주세요.</p>
        <hr>
        <p style="font-size: 12px; color: gray;">본 메일은 발신 전용입니다.</p>
    </div>
    """
    
    message = MessageSchema(
        subject="[Bit-Bite] 이메일 인증번호 도착 🚀",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)
    print(f"✅ [이메일 전송 완료] {email_to}")