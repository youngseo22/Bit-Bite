import asyncio
import os
import sys
import httpx
from datetime import datetime

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend-service:80")

# API를 호출하고 상태를 확인
async def call_api(client: httpx.AsyncClient, path: str, method: str = 'POST'):
    url = f"{BACKEND_API_URL}/{path}"
    print(f"[{datetime.now()}] API 호출: {url}")
    
    if method == 'POST': resp = await client.post(url)
    elif method == 'DELETE': resp = await client.delete(url)
    
    resp.raise_for_status()
    print(f"[{datetime.now()}] API 호출에 성공하였습니다.")

    return True

# 질문 생성 -> 이메일 발송 API를 순차적으로 호출
async def run_daily_challenge():
    print(f"[{datetime.now()}] 질문 생성 및 메일 발송 API가 시작되었습니다.")
    success = False
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            await call_api(client, "api/generate-question", method='POST') 
            await call_api(client, "api/send-daily-questions", method='POST')
            success = True
        except Exception as e:
            print(f"[{datetime.now()}] 질문 생성 및 메일 발송 API 호출에 실패: {e}")
            success = False
            
    return success

# 데이터 정리 API를 호출
async def run_monthly_cleanup():
    print(f"[{datetime.now()}] 이전 달의 질문 삭제 API가 시작되었습니다.")
    success = False
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            await call_api(client, "api/delete-old-questions", method='DELETE')
            success = True
        except Exception as e:
            print(f"[{datetime.now()}] 이전 달의 질문 삭제 API 호출에 실패: {e}")
            success = False
            
    return success

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)

    job_type = sys.argv[1]
    success = False

    if job_type == "daily-challenge":
        success = asyncio.run(run_daily_challenge())
    elif job_type == "monthly-cleanup":
        success = asyncio.run(run_monthly_cleanup())
    else:
        sys.exit(1)

    if success:
        sys.exit(0)
    else:
        sys.exit(1)