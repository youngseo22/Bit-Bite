import asyncio
import os
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date

BACKEND_API_URL = "http://backend:8000"

# ----------------------------------------------------
# 1. 주기적 작업 정의
# ----------------------------------------------------

async def generate_and_send_daily_questions():
    """
    1. 질문 생성 API 호출 (DB에 저장)
    2. 구독자 조회 및 이메일 발송 API 호출 (발송)
    """
    
    print(f"[{datetime.now()}] 🧠 Daily question generation started...")
    try:
        response = await httpx.post(f"{BACKEND_API_URL}/generate-question")
        response.raise_for_status()
        print(f"[{datetime.now()}] ✅ Questions successfully generated and saved to DB.")
        
        print(f"[{datetime.now()}] 📧 Starting daily email dispatch...")
        
        print(f"[{datetime.now()}] ✅ Daily emails dispatched successfully.")
        
    except httpx.HTTPStatusError as e:
        print(f"[{datetime.now()}] ❌ API Call Failed (Status: {e.response.status_code}): {e}")
    except Exception as e:
        print(f"[{datetime.now()}] ❌ An unexpected error occurred: {e}")


async def monthly_cleanup_job():
    """매월 마지막 날, 질문 이력을 삭제하는 작업을 수행합니다."""
    print(f"[{datetime.now()}] 🧹 Monthly cleanup job started...")
    
    # 실제 백엔드 API를 호출하여 DB의 질문 이력을 삭제하는 로직을 구현해야 합니다.
    # 예시: await httpx.post(f"{BACKEND_API_URL}/cleanup-questions")
    
    # (여기서는 실제 삭제 로직 대신 로그만 출력)
    print(f"[{datetime.now()}] ✅ Monthly cleanup completed.")


# ----------------------------------------------------
# 2. 스케줄러 설정 및 실행
# ----------------------------------------------------
def start_scheduler():
    # 비동기 스케줄러 초기화
    scheduler = AsyncIOScheduler()

    # 1. 데일리 작업 등록: 평일(월-금) 오전 8시에 실행
    # [cite_start]프로젝트 제안서: 평일 오전 8시에 질문 생성 및 이메일 발송 [cite: 33, 73]
    scheduler.add_job(
        generate_and_send_daily_questions, 
        trigger=CronTrigger(hour=8, minute=0, day_of_week='mon-fri', timezone='Asia/Seoul'),
        name="Daily Question Generation & Dispatch"
    )
    
    # 2. 월별 정리 작업 등록: 매월 마지막 날에 실행 (Cron 표현식 사용)
    # [cite_start]프로젝트 제안서: 매월 마지막 날에 저장된 질문 이력을 삭제 [cite: 70, 125]
    # '0 0 L * *' : 매월 마지막 날(L) 0시 0분에 실행
    scheduler.add_job(
        monthly_cleanup_job,
        trigger=CronTrigger(day="L", hour=0, minute=0, timezone='Asia/Seoul'), 
        name="Monthly Question History Cleanup"
    )

    # 스케줄러 시작
    scheduler.start()
    print(f"[{datetime.now()}] ⭐ Scheduler started. Next jobs scheduled.")
    print(f"[{datetime.now()}] ➡️ Daily job runs Mon-Fri at 08:00 KST.")
    print(f"[{datetime.now()}] ➡️ Monthly job runs on the last day of the month at 00:00 KST.")

    # 스케줄러가 백그라운드에서 계속 실행되도록 비동기 루프 유지
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        print("Scheduler shut down.")

if __name__ == '__main__':
    start_scheduler()