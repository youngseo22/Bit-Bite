import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RetryDialog } from '@/components/RetryDialog';
// import BackgroundGroundImage from '../assets/GradientBackground.png';

export function QuestionPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [isExtended, setIsExtended] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isTimeExtendedVisual, setIsTimeExtendedVisual] = useState(false);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);

  const answerRef = useRef(answer);
  answerRef.current = answer;

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const handleSubmit = useCallback(() => {
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    
    const submissionData = {
      user_answer: answerRef.current,
      question_id: 1,
      question_text: question,
      field: "컴퓨터공학"
    };

    navigate('/feedback', { state: { submission: submissionData } });
  }, [isLoading, question, navigate]);

  useEffect(() => {
    setQuestion(`관계형 데이터베이스에서 트랜잭션의 ACID 속성(원자성, 일관성, 고립성, 지속성) 각각이 의미하는 바를 설명하고, 데이터베이스 관리 시스템(DBMS)이 이러한 속성들을 보장하기 위해 내부적으로 어떤 기술적 메커니즘(예: 잠금, 로깅, 2단계 커밋 등)들을 활용하는지 구체적인 예시를 들어 상세히 설명하세요.`);
  }, [category]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);
  
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
      <h1 className="text-3xl font-bold">[{formattedDate}]</h1>
      <h1 className="flex items-center justify-center mt-2 gap-2 text-3xl font-bold mb-8">오늘의 <span className='text-4xl text-main'>{category?.toUpperCase()}</span> 질문</h1>
      
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

      <p className="text-md mb-8 w-full md:max-w-2xl text-gray-600">{question}</p>

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
