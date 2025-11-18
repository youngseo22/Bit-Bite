import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from "lucide-react";

interface Feedback {
  score: number;
  summary: string;
  goodPoints: string[];
  badPoints: string[];
  goodToAddPoints: string[];
}

export function FeedbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFeedback({
        score: 88,
        summary: "핵심 키워드를 사용하여 질문의 의도를 잘 파악했지만, 일부 개념 설명에서 기술적 정확성이 다소 부족합니다. 답변의 구조를 조금 더 명확히 하면 논리성이 향상될 것입니다.",
        goodPoints: [
          "질문의 핵심 키워드인 'Coroutine Scope'와 'Structured Concurrency'를 정확히 포함하여 답변했습니다.",
          "답변의 도입부가 주제를 명확하게 제시하여 이해하기 쉬웠습니다."
        ],
        badPoints: [
          "'Coroutine Context'와 'Dispatcher'의 관계 설명이 일부 부정확하여 혼동을 줄 수 있습니다.",
          "전체적인 답변이 하나의 긴 문단으로 구성되어 있어 가독성이 떨어집니다. 논리적인 단위로 문단을 나누는 것이 좋습니다."
        ],
        goodToAddPoints: [
          "예외 처리(Exception Handling)가 'Structured Concurrency'에서 어떻게 동작하는지에 대한 예시 코드를 추가하면 이해도를 높일 수 있습니다.",
          "SupervisorJob과 Job의 차이점을 설명하여 코루틴의 에러 전파를 어떻게 제어하는지 보여주면 더 완성도 높은 답변이 될 것입니다."
        ]
      });
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex flex-col items-center px-4 text-center text-gray-800 ${isLoading ? 'h-full justify-center' : 'py-12'}`}>
      {isLoading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 mb-5 animate-spin" />
          <h1 className="text-2xl font-bold">AI가 답변을 분석중입니다...</h1>
        </div>
      ) : feedback && (
        <div className="w-full max-w-2xl text-left">
          <h2 className="text-3xl font-bold mb-4 text-center ">피드백 결과</h2>
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4 border-b pb-4">
              <p className="text-lg font-semibold text-center">종합 점수: <span className="text-blue-600">{feedback.score}점</span></p>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">요약</h3>
              <p className="text-gray-700">{feedback.summary}</p>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-blue-600">잘한 점</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.goodPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-red-600">개선할 점</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.badPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">추가하면 좋은 내용</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.goodToAddPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Link to="/" className="mt-8">
        <button className="group flex items-center gap-2 text-">
          <svg
            className="group-hover:-translate-x-1 transition pt-0.5"
            width="12"
            height="9"
            viewBox="0 0 12 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 4.5H0.818M4 1L0 4.5L4 8"
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          홈으로 돌아가기
        </button>
      </Link>
    </div>
  );
}
