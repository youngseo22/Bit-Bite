import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

load_dotenv()

# 1. 이메일 서버 설정 (Configuration)
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_USERNAME"),
    MAIL_PORT = 465,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

# 이메일 인증 코드 전송 함수
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


# 데일리 질문 전송 함수
async def send_daily_question(email_to: str, question_text: str, field_name: str, question_date: str):
    html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2c3e50;">Bit-Bite 오늘의 질문</h2>
            <p>안녕하세요! 오늘의 질문을 확인해보세요.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #e67e22;">{question_text}</h3>
            </div>
            
            <p style="margin-bottom: 20px;">답변하러 가기 전에 질문을 복사해 두는 것을 추천합니다.</p>
            
            <a href="http://127.0.0.1:8000/questions/{field_name}/{question_date}"
            style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            오늘의 질문에 답변하러 가기 (바로가기)
            </a>
            <p style="margin-top: 30px;">좋은 하루 되세요!</p>
            <hr>
            <p style="font-size: 12px; color: gray;">본 메일은 발신 전용입니다.</p>
        </div>
    """
    
    message = MessageSchema(
        subject="[Bit-Bite] 오늘의 질문 도착 🚀",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)
    print(f"✅ [질문 이메일 전송 완료] {email_to}")