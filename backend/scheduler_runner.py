import asyncio
import os
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend:8000")

async def job_generate_next_questions():
    print(f"[{datetime.now()}] 질문 생성 시작")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(f"{BACKEND_API_URL}/generate-question")
            resp.raise_for_status()
            print(f"[{datetime.now()}] 질문 생성 API가 성공적으로 호출되었습니다.")
        except Exception as e:
            print(f"[{datetime.now()}] 질문 생성에 실패하였습니다: {e}")
    
async def job_send_daily_emails():
    print(f"[{datetime.now()}] 오늘의 메일 전송 시작")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(f"{BACKEND_API_URL}/send-daily-questions")
            resp.raise_for_status()
            print(f"[{datetime.now()}] 이메일 전송에 성공하였습니다.")
        except Exception as e:
            print(f"[{datetime.now()}] 이메일 생성에 실패하였습니다: {e}")

async def job_monthly_cleanup():
    print(f"[{datetime.now()}] 이번 달의 질문 삭제 시작")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            await client.delete(f"{BACKEND_API_URL}/delete-old-questions")
            print(f"[{datetime.now()}] 이전 달의 데이터 삭제에 성공하였습니다.")
        except Exception as e:
            print(f"[{datetime.now()}] 이전 달의 데이터 삭제에 실패하였습니다: {e}")

async def main():
    scheduler = AsyncIOScheduler()

    # 1. 질문 생성: 평일 오전 8시
    scheduler.add_job(
        job_generate_next_questions,
        trigger=CronTrigger(day_of_week='mon-fri', hour=8, minute=0),
        name="Generate Next Questions"
    )

    # 2. 이메일 발송: 평일 오전 8시
    scheduler.add_job(
        job_send_daily_emails,
        trigger=CronTrigger(day_of_week='mon-fri', hour=8, minute=0),
        name="Send Daily Emails"
    )

    # 3. 데이터 정리: 매월 말일 23시
    scheduler.add_job(
        job_monthly_cleanup,
        trigger=CronTrigger(day='last', hour=23, minute=0),
        name="Monthly Cleanup"
    )

    scheduler.start()
    print(f"[{datetime.now()}] 스케줄러 시작")

    try:
        while True:
            await asyncio.sleep(1000)
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == '__main__':
    asyncio.run(main())