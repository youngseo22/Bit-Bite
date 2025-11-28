from google import genai
from google.genai import types
from fastapi import HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select 

from datetime import datetime, date
from utils import get_next_weekday

# DB 모델 및 Pydantic 모델 임포트
from models import Question, StudyField, User 
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

def save_new_question_to_db(db: Session, track: StudyField, question_text: str, target_date: datetime.date):
    """새로운 질문을 DB에 저장합니다."""
    
    new_question = Question(
        content=question_text,
        field=track.value, # StudyField의 문자열 값 저장
        daily_question_date=target_date
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)


    
# ----------------------------------------------------
# 2. AI 질문 생성 로직 (CronJob 호출용)
# ----------------------------------------------------
# DB 쿼리 함수가 동기식이지만, FastAPI의 비동기 환경 유지를 위해 async def 유지
async def generate_new_question_for_all_tracks(db: Session): 
    today = date.today()
    scheduled_date = get_next_weekday(today)
    
    TRACKS = [StudyField.CS, StudyField.AI, StudyField.CLOUD] 
    
    for track in TRACKS:
        # DB에서 이전 질문 목록 조회
        previous_questions = get_previous_questions_from_db(db, track)
        
        # 프롬프트 구성: 중복 방지 요청 포함
        prompt = f"""
            당신은 10년 차 시니어 개발자 면접관입니다.
            지원자의 기술 스택 '{track.value}'에 대해 실무 역량을 검증할 수 있는 **심층 기술 면접 질문 1개**를 생성하세요.

            [제약 사항]
            1. **길이 제한:** 사용자가 5분 안에 답변해야 하므로, 질문은 **반드시 200자 이내의 세 문장 이내**로 간결하게 작성하세요.
            2. **난이도:** 실무 1~3년 차(Junior-Mid) 수준에 맞춰, 단순 정의보다는 '원리', '트러블슈팅', '사용 이유(Why)'를 묻는 질문을 우선시하세요.
            3. **중복 방지:** 다음 이전 질문들과 중복되지 않게 하세요: [{', '.join(previous_questions)}]
            4. **형식:** 질문은 한국어로 작성하며, 구체적인 상황을 가정하거나 예시를 들어도 좋습니다.
            5. **출력:** 서론, 부연 설명, 따옴표 없이 **오직 질문 텍스트 한 문장(또는 두 문장)**만 출력하세요.

            질문 예시:
            - (나쁜 예) Virtual DOM이 무엇인가요?
            - (좋은 예) Virtual DOM이 실제 DOM보다 빠르다고 하는 이유는 무엇이며, 항상 더 빠를까요?
        """
        
        try:
            # Gemini API 호출
            response = gemini_client.models.generate_content(
                model=MODEL_NAME, contents=prompt
            )
            new_question = response.text.strip()
            
            # DB에 저장
            save_new_question_to_db(db, track, new_question, scheduled_date)
            
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI 질문 생성 실패")


# ----------------------------------------------------
# 3. AI 답변 분석 및 피드백 로직 (실시간 사용자 요청)
# ----------------------------------------------------
async def analyze_and_feedback(question_text: str, field: StudyField, user_answer: str) -> FeedbackResult:
    """조회된 질문과 사용자 답변을 받아 AI 분석 후 실시간 피드백을 JSON으로 생성"""

    track_value_str = str(field.name) # Enum의 이름(CS, AI 등)을 사용
    
    # 프롬프트: JSON 형식 요청
    prompt = f"""
    당신은 10년 차 시니어 개발자이자 냉철한 기술 면접관 AI입니다. 
    제공된 정보를 바탕으로 지원자의 답변을 평가하세요.

    [면접 정보]
    - 질문: {question_text}
    - 기술 분야: {track_value_str}
    - 사용자 답변: {user_answer}

    [평가 기준]
    1. 핵심 키워드 포함 여부
    2. 기술적 정확성 (오개념이 없는지)
    3. 두괄식 답변 및 논리적 구조

    [지침]
    1. **JSON 포맷 준수:** 출력은 오직 순수한 JSON 문자열이어야 합니다. 마크다운 코드 블록(```json)을 사용하지 마세요.
    2. **강조 기호 금지:** JSON 값 내부의 텍스트에 볼드체(**)나 기울임꼴(*) 등의 마크다운 문법을 절대 사용하지 마세요.
    3. **언어:** 모든 피드백 내용은 '한국어'로 작성하세요.
    
    [출력 형식 (JSON)]
    {{ 
      "score": <점수 (0-100, 정수)>,
      "model_answer": <300자 이내의 당신이 생각하는 가장 이상적이고 간결한 모범 답안>,
      "well_done": [<잘한 점 1>, <잘한 점 2>],
      "improvements": [<구체적인 개선점 1>, <개선점 2>], 
      "additional_content": [<답변을 보강하기 위해 공부하면 좋은 개념이나 링크 키워드>]
    }}"""
    try:
        response = gemini_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        return FeedbackResult.parse_raw(response.text)

    except Exception as e:
        print(f"FATAL AI PROCESSING ERROR: {e}") 
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI 피드백 처리 중 오류가 발생했습니다."
        )

    
def get_question_by_id(db: Session, question_id: int) -> Question:
    """ID로 특정 질문 객체를 조회합니다."""
    
    # 2.0 스타일: select(Question) 전체를 조회하고, where로 필터링
    stmt = select(Question).where(Question.id == question_id)
    
    # first() 대신 scalar_one_or_none()을 사용하여 결과를 가져오고, 
    # 결과가 없으면 None을 반환합니다.
    question = db.execute(stmt).scalar_one_or_none()
    
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Question not found"
        )
        
    return question