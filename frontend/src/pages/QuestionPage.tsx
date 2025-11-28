import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RetryDialog } from '@/components/RetryDialog';
import { getQuestion } from '@/api/api';
import { Loader2 } from 'lucide-react';
// import BackgroundGroundImage from '../assets/GradientBackground.png';

interface QuestionData {
  content: string;
  daily_question_date: string;
  field: string;
  id: number;
}

export function QuestionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
    const [isExtended, setIsExtended] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [isTimeExtendedVisual, setIsTimeExtendedVisual] = useState(false);
    const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  
    const answerRef = useRef(answer);
    answerRef.current = answer;
  
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const fieldMap: { [key: string]: string } = {
    "인공지능": "AI",
    "클라우드": "Cloud",
    "컴퓨터공학": "CS",
  };

  const displayField = questionData?.field ? fieldMap[questionData.field] || questionData.field : '';
  
    const handleSubmit = useCallback(() => {
      if (isLoading) return;
      setIsLoading(true);
      
      const submissionData = {
        question_id: questionData?.id || 0,
        user_answer: answerRef.current,
      };
  
      navigate('/feedback', { state: { submission: submissionData } });
    }, [isLoading, navigate, questionData?.id]);
  
    useEffect(() => {
      const fetchQuestion = async () => {
        setIsLoading(true);
        if (!id) {
          setError("질문 ID를 찾을 수 없습니다.");
          setIsLoading(false);
          return;
        }
        try {
          const data = await getQuestion(Number(id)) as QuestionData;
          setQuestionData(data);
          setError(null);
        } catch (err) {
          console.error("Failed to get question:", err);
          setError("질문을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        setIsLoading(false);
      };
      fetchQuestion();
    }, [id]);

  useEffect(() => {
    if (questionData && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [questionData, timeLeft]);
  
  useEffect(() => {
    if (timeLeft <= 0 && !isTimeUp) {
      if (answerRef.current.trim().length === 0) {
        setIsTimeUp(true);
        setIsRetryDialogOpen(true);
      } else {
        handleSubmit();
      }
    }
  }, [timeLeft, isTimeUp, handleSubmit]);

  const handleExtendTime = () => {
    if (!isExtended) {
      setTimeLeft(prevTime => prevTime + 5 * 60);
      setIsExtended(true);
      setIsTimeExtendedVisual(true);
      setTimeout(() => {
        setIsTimeExtendedVisual(false);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const goToHome = () => {
    navigate('/');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <>
    <div
      // className="h-full flex flex-col items-center justify-center pb-15 px-4 text-center bg-center bg-no-repeat bg-cover md:bg-contain text-gray-800"
      // style={{backgroundImage: `url(${BackgroundGroundImage})`}}>
      className="h-full flex flex-col items-center justify-center px-4 text-center text-gray-800">
      {isLoading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 mb-5 animate-spin" />
          <h1 className="text-2xl font-bold">질문을 불러오는 중입니다...</h1>
        </div>
      ) : (
      <>
        <h1 className="text-3xl font-bold">[{questionData?.daily_question_date || formattedDate}]</h1>
        <h1 className="flex items-center justify-center mt-2 gap-2 text-3xl font-bold mb-8">오늘의 <span className='text-3xl text-main'>{displayField?.toUpperCase()}</span> 질문</h1>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex items-center gap-4 mb-4">
          <div className={`text-2xl font-mono font-bold ${timeLeft <= 60 ? 'text-red-500' : isTimeExtendedVisual ? 'text-green-500' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtendTime}
            disabled={isExtended || isTimeUp}
          >
            +5 분
          </Button>
        </div>

        <p className="text-md mb-8 w-full md:max-w-2xl text-gray-600">{questionData?.content}</p>

        <div className="w-full flex flex-col md:max-w-2xl">
          <Textarea
            placeholder="여기에 답변을 입력하세요..."
            value={answer}
            maxLength={400}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[200px] text-base w-full p-4 bg-transparent border border-gray-200 focus:outline-none"
            disabled={isTimeUp}
          />
          <div className='flex justify-between'>
            <p className="text-left text-sm text-red-500 mt-1">제한 시간이 지나면 자동으로 제출됩니다.</p>
            <p className="text-right text-sm text-gray-600 mt-1">{answer.trim().length}/400</p>
          </div>
        </div>
        <Button
          type='button'
          className="mt-4 w-full md:max-w-2xl md:mx-auto h-10"
          onClick={handleSubmit}
          disabled={isLoading || answer.trim().length === 0 || isTimeUp}>
          제출하기
        </Button>
      </>
      )}
    </div>

    <RetryDialog
      isOpen={isRetryDialogOpen}
      onOpenChange={setIsRetryDialogOpen}
      onCancle={goToHome}
      onConfirm={refreshPage}
    />
    </>
  );
}

