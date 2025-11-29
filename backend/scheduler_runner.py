import asyncio
import os
import sys # 명령줄 인자를 받기 위해 추가
import httpx
from datetime import datetime

# 🚨 K8s 설정 반영: 백엔드 서비스 주소 사용
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend-service:80")

# ----------------------------------------------------
# 1. API 호출 함수 정의
# ----------------------------------------------------

async def call_api(client: httpx.AsyncClient, path: str, method: str = 'POST'):
    """API를 호출하고 상태를 확인하는 헬퍼 함수"""
    url = f"{BACKEND_API_URL}/{path}"
    print(f"[{datetime.now()}] ➡️ Calling API: {url}")
    
    if method == 'POST':
        resp = await client.post(url)
    elif method == 'DELETE':
        resp = await client.delete(url)
    
    resp.raise_for_status()
    print(f"[{datetime.now()}] ✅ API call successful.")

    return True

async def run_daily_challenge():
    """1. 질문 생성 API 호출 후, 2. 이메일 발송 API를 순차적으로 호출합니다."""
    print(f"[{datetime.now()}] 🧠 Daily Challenge Job started (Generate & Send).")
    success = False
    
    # 🚨 참고: 원래 코드는 60초 타임아웃을 사용했으므로, 그대로 유지합니다.
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # 1. 질문 생성 (/generate-question 호출)
            await call_api(client, "/api/generate-question", method='POST') 
            
            # 2. 이메일 발송 (/send-daily-questions 호출)
            await call_api(client, "/api/send-daily-questions", method='POST')

            success = True
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Daily challenge failed: {e}")
            success = False
            
    return success

async def run_monthly_cleanup():
    """데이터 정리 API를 호출합니다."""
    print(f"[{datetime.now()}] 🧹 Monthly Cleanup Job started.")
    success = False
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # 이전 달의 데이터 삭제 API 호출
            await call_api(client, "/api/delete-old-questions", method='DELETE')
            success = True
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Monthly cleanup failed: {e}")
            success = False
            
    return success

# ----------------------------------------------------
# 2. 메인 실행 진입점 (단발성 작업 실행)
# ----------------------------------------------------
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

    # Job Pod 종료 코드: 0이면 성공, 1이면 실패 (CronJob이 재시작 시도 가능)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)