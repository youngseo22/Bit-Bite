import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { requestFeedback } from '@/api/api';

interface Feedback {
  score: number;
  model_answer: string[];
  well_done: string[];
  improvements: string[];
  additional_content: string[];
}

export function FeedbackPage() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getFeedback = async () => {
      if (location.state?.submission) {
        try {
          const feedbackResponse = await requestFeedback(location.state.submission);
          setFeedback(feedbackResponse as Feedback);
        } catch (err) {
          console.error("Failed to get feedback:", err);
          setError("피드백을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } else {
        setError("잘못된 접근입니다. 답변을 먼저 제출해주세요.");
      }
      setIsLoading(false);
    };

    getFeedback();
  }, [location.state]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 mb-5 animate-spin" />
          <h1 className="text-2xl font-bold">AI가 답변을 분석 중입니다...</h1>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">오류</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (feedback) {
      const submissionData = location.state?.submission;
      const userAnswer = submissionData?.user_answer;

      return (
        <div className="w-full max-w-2xl text-left">
          <h2 className="text-3xl font-bold mb-4 text-center ">나의 답변</h2>
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{userAnswer}</p>
          </div>

          <h2 className="text-3xl font-bold mb-4 mt-10 text-center ">피드백 결과</h2>
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4 border-b pb-4">
              <p className="text-lg font-semibold text-center">종합 점수: <span className="text-blue-600">{feedback.score}점</span></p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-600">모범 답안</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.model_answer}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-blue-600">잘한 점</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.well_done.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-red-600">개선할 점</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.improvements.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">추가하면 좋은 내용</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {feedback.additional_content.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // This case should ideally not be reached if error handling is correct.
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">피드백을 불러올 수 없습니다.</h2>
            <p>알 수 없는 오류가 발생했습니다.</p>
        </div>
    );
  };

  return (
    <div className={`flex flex-col items-center px-4 text-center text-gray-800 ${isLoading ? 'h-full justify-center' : 'py-12'}`}>
      {renderContent()}

      {!isLoading && (
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
      )}
    </div>
  );
}
