import asyncio
import os
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

# 도커 네트워크 상의 백엔드 주소
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend:8000")

# ----------------------------------------------------
# 1. 주기적 작업 정의
# ----------------------------------------------------

async def generate_and_send_daily_questions():
    print(f"[{datetime.now()}] 🧠 Daily job started...")
    timeout = httpx.Timeout(60.0, connect=10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            # 1. 질문 생성
            print(f"[{datetime.now()}] 1️⃣ Requesting question generation...")
            gen_response = await client.post(f"{BACKEND_API_URL}/generate-question")
            # gen_response.raise_for_status()
            print(f"[{datetime.now()}] ✅ Generation complete.")

            # # 2. 이메일 발송
            # print(f"[{datetime.now()}] 2️⃣ Requesting email dispatch...")
            # email_response = await client.post(f"{BACKEND_API_URL}/api/emails/send-daily")
            # email_response.raise_for_status()
            # print(f"[{datetime.now()}] ✅ Email dispatch request successful.")

        except httpx.HTTPStatusError as e:
            print(f"[{datetime.now()}] ❌ API Error: {e}")
        except httpx.RequestError as e:
            print(f"[{datetime.now()}] ❌ Connection Error: {e}")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Unexpected Error: {e}")

async def monthly_cleanup_job():
    print(f"[{datetime.now()}] 🧹 Monthly cleanup job started...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{BACKEND_API_URL}/api/questions/history")
            response.raise_for_status()
            print(f"[{datetime.now()}] ✅ Cleanup completed.")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Cleanup failed: {e}")

# ----------------------------------------------------
# 2. 스케줄러 설정 및 실행 (여기가 핵심 변경!)
# ----------------------------------------------------
async def main():
    # 1. 스케줄러 생성
    scheduler = AsyncIOScheduler()

    # 2. 작업 등록 (테스트용: 10초마다 실행 / 실제: CronTrigger 주석 해제)
    scheduler.add_job(
        generate_and_send_daily_questions,
        trigger=CronTrigger(hour=8, minute=0, day_of_week='mon-fri'),
        name="Daily Question Job"
    )

    scheduler.start()
    print(f"[{datetime.now()}] 🚀 Scheduler started. Jobs scheduled.")
    print(f"[{datetime.now()}] 🧠 Daily Question Job: Scheduled for 08:00 on Mon-Fri (평일 오전 8시)")

    # 4. 무한 대기 (스케줄러 꺼짐 방지)
    try:
        while True:
            await asyncio.sleep(1000)
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == '__main__':
    asyncio.run(main())