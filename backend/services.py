# services.py

from google import genai
from google.genai import types
from fastapi import HTTPException, status
from typing import List
from sqlalchemy.orm import Session # 동기 DB 세션 임포트
from sqlalchemy import select

# DB 모델 및 Pydantic 모델 임포트
from models import Question, StudyField 
from schemas import FeedbackResult, AnswerSubmission 

# ----------------------------------------------------
# AI 클라이언트 초기화
# ----------------------------------------------------
gemini_client = genai.Client()
MODEL_NAME = 'gemini-2.5-flash'

# ----------------------------------------------------
# 1. 쿼리 로직 구현 (DB와의 통신 부분)
# ----------------------------------------------------
def get_previous_questions_from_db(db: Session, track: StudyField) -> List[str]:
    """
    DB에서 해당 분야의 모든 질문 content를 조회합니다. (한 달 주기 초기화 규칙 반영)
    """
    
    # 쿼리: 해당 분야(field)의 모든 질문(Question.content)만 조회
    # 동기 세션에서 .all()을 사용하여 쿼리 결과를 가져옵니다.
    previous_questions = db.query(Question.content).filter(
        Question.field == track.value
    ).all()
    
    # 결과가 튜플 리스트로 반환되므로, 문자열 리스트로 변환합니다.
    return [q[0] for q in previous_questions]

def save_new_question_to_db(db: Session, track: StudyField, question_text: str):
    """새로운 질문을 DB에 저장합니다."""
    
    new_question = Question(
        content=question_text,
        field=track.value # StudyField의 문자열 값 저장
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
# ----------------------------------------------------
# 2. AI 질문 생성 로직 (CronJob 호출용)
# ----------------------------------------------------
# DB 쿼리 함수가 동기식이지만, FastAPI의 비동기 환경 유지를 위해 async def 유지
async def generate_new_question_for_all_tracks(db: Session): 
    
    TRACKS = [StudyField.CS, StudyField.AI, StudyField.CLOUD] 
    
    for track in TRACKS:
        # DB에서 이전 질문 목록 조회
        previous_questions = get_previous_questions_from_db(db, track)
        
        # 프롬프트 구성: 중복 방지 요청 포함
        prompt = f"""당신은 기술 면접관 AI입니다. 기술 분야 '{track.value}'에 대한 심층 기술 면접 질문 1개를 생성하세요.
        이전 질문 이력: {', '.join(previous_questions)}
        이전 질문과 중복되지 않으며, 학습자의 설명 능력을 평가할 수 있어야 합니다. 질문만 명확하게 출력하세요."""
        
        try:
            # Gemini API 호출
            response = gemini_client.models.generate_content(
                model=MODEL_NAME, contents=prompt
            )
            new_question = response.text.strip()
            
            # DB에 저장
            save_new_question_to_db(db, track, new_question)
            
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI 질문 생성 실패")


# ----------------------------------------------------
# 3. AI 답변 분석 및 피드백 로직 (실시간 사용자 요청)
# ----------------------------------------------------
async def analyze_and_feedback(submission: AnswerSubmission) -> FeedbackResult:
    """사용자 답변을 분석하고 JSON 형식의 피드백을 실시간으로 생성"""

    track_value_str = str(submission.field)
    
    # 프롬프트: JSON 형식 요청
    prompt = f"""당신은 기술 면접관 AI입니다. 질문: {submission.question_text} (분야: {track_value_str}) 
    사용자 답변: {submission.user_answer}
    분석 항목: 핵심 키워드, 기술적 정확성, 논리성. 
    
    피드백을 엄격히 다음 **JSON 형식(영어 키 사용)**으로 제공:
    {{ 
      "well_done": ["..."], 
      "improvements": ["..."], 
      "additional_content": ["..."] 
    }}"""
    try:
        response = gemini_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        # 디버그: 응답 텍스트를 터미널에 출력 (파싱 전)
        print(f"DEBUG: Gemini Raw Response Text: {response.text}") 
        
        return FeedbackResult.parse_raw(response.text)

    except Exception as e:
        # 실제 예외 메시지를 터미널에 출력
        print(f"FATAL AI PARSING ERROR: {e}") 
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI 피드백 처리 중 오류가 발생했습니다."
        )