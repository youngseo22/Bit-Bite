import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// import BackgroundGroundImage from '../assets/GradientBackground.png';

export function QuestionPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { day } = useParams<{ day: string }>();
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [isExtended, setIsExtended] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isTimeExtendedVisual, setIsTimeExtendedVisual] = useState(false); // New state for visual feedback

  const answerRef = useRef(answer);
  answerRef.current = answer;

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const handleSubmit = useCallback(() => {
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    // TODO: Submit answer to the backend
    console.log({ category, day, answer: answerRef.current });
    // Navigate to the feedback page
    navigate('/feedback');
  }, [navigate, category, day, isLoading]);

  useEffect(() => {
    // TODO: Fetch question from backend based on category
    // For now, using a placeholder
    setQuestion(`질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 질문 넣을 자리 `);
  }, [category]);

  useEffect(() => {
    if (isTimeUp) return;

    if (timeLeft <= 0) {
      if (answerRef.current.trim().length === 0) {
        setIsTimeUp(true);
      } else {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit, isTimeUp]);

  const handleExtendTime = () => {
    if (!isExtended) {
      setTimeLeft(prevTime => prevTime + 5 * 60); // Add 5 minutes
      setIsExtended(true);
      setIsTimeExtendedVisual(true); // Activate visual feedback
      setTimeout(() => {
        setIsTimeExtendedVisual(false); // Deactivate after a short delay
      }, 700); // 0.7초 후에 원래 색상으로 돌아옴
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
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

      <div className="w-full md:max-w-2xl">
        <Textarea
          placeholder="여기에 답변을 입력하세요..."
          value={answer}
          maxLength={400}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[200px] text-base w-full p-4 bg-transparent border border-gray-200 focus:outline-none"
          disabled={isTimeUp}
        />
        <p className="text-right text-sm text-gray-600 mt-1">{answer.trim().length}/400</p>
      </div>
      <Button
        type='button'
        className="mt-4 w-full md:max-w-2xl md:mx-auto h-10"
        onClick={handleSubmit}
        disabled={isLoading || answer.trim().length === 0 || isTimeUp}>
        제출하기
      </Button>
    </div>
  );
}
