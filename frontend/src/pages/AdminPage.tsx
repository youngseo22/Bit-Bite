import { useState, useEffect, Fragment, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getMonthQuestion, putNextQuestion, type QuestionFromApi } from '../api/api';

// --- Data Structure ---
type Question = {
  id: number;
  field: string;
  content: string;
};

type DailyQuestions = {
  date: string; // YYYY-MM-DD
  questions: Question[];
};

// --- Helper Functions ---
function getQuestionStatus(questionDate: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const qDate = new Date(questionDate.getFullYear(), questionDate.getMonth(), questionDate.getDate());

  // 시간차 계산 (밀리초 단위)
  const diffTime = qDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;
  
  // 과거 질문
  if (diffDays < 0) {
    return { status: '전송 완료', isEditable: false, isVisible: true };
  }

  // 오늘 질문
  if (isToday) {
    // 오전 7시 30분 이전: 수정 가능
    if (now.getHours() * 60 + now.getMinutes() < 7 * 60 + 30) {
      return { status: '수정 가능', isEditable: true, isVisible: true };
    }
    // 오전 8시 이전: 수정 마감
    if (now.getHours() < 8) {
      return { status: '수정 마감', isEditable: false, isVisible: true };
    }
    // 오전 8시 이후: 전송 완료
    return { status: '전송 완료', isEditable: false, isVisible: true };
  }

  const qDayOfWeek = qDate.getDay(); // 0:Sun, 1:Mon, ..., 6:Sat
  const nowDayOfWeek = now.getDay();

  // 월요일 질문 (qDayOfWeek === 1)
  if (qDayOfWeek === 1) {
    // 금요일(5) 08시 이후부터 ~ 월요일(1) 07시 30분 이전까지
    const isFridayAfter8 = nowDayOfWeek === 5 && now.getHours() >= 8;
    const isSaturday = nowDayOfWeek === 6;
    const isSunday = nowDayOfWeek === 0;
    const isMondayBefore730 = nowDayOfWeek === 1 && (now.getHours() * 60 + now.getMinutes() < 7 * 60 + 30);
    
    // 이 조건은 다음 주 월요일에만 해당
    if (diffDays > 1 && diffDays <= 3 && (isFridayAfter8 || isSaturday || isSunday)) {
       return { status: '수정 가능', isEditable: true, isVisible: true };
    }
     if (isMondayBefore730) {
       return { status: '수정 가능', isEditable: true, isVisible: true };
    }
  }
  
  // 내일 질문 (월-목)
  if (isTomorrow) {
    // 오늘 08시 이후부터 수정 가능
    if (now.getHours() >= 8) {
      return { status: '수정 가능', isEditable: true, isVisible: true };
    }
    return { status: '생성 대기', isEditable: false, isVisible: true }; // 8시 이전에는 보여주되 수정 불가
  }
  
  // 그 외 미래 질문
  return { status: '생성 대기', isEditable: false, isVisible: true };
}


export function AdminPage() {
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestions[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editedQuestionContent, setEditedQuestionContent] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('전체');

  const fetchQuestions = async () => {
    try {
      const questionsFromApi: QuestionFromApi[] = await getMonthQuestion();
      
      const groupedQuestions = questionsFromApi.reduce((acc, q) => {
        const date = q.daily_question_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({ id: q.id, field: q.field, content: q.content });
        return acc;
      }, {} as Record<string, Question[]>);

      const dailyQuestionsData: DailyQuestions[] = Object.entries(groupedQuestions).map(([date, questions]) => ({
        date,
        questions,
      }));
      
      setDailyQuestions(dailyQuestionsData);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEdit = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestionContent(question.content);
  };

  const handleCancel = () => {
    setEditingQuestionId(null);
    setEditedQuestionContent('');
  };

  const handleSave = async () => {
    if (editingQuestionId === null) return;

    try {
      await putNextQuestion(editingQuestionId, editedQuestionContent);
      setDailyQuestions(dailyQuestions.map(day => ({ 
        ...day, 
        questions: day.questions.map(q => 
          q.id === editingQuestionId ? { ...q, content: editedQuestionContent } : q
        ) 
      })));
      handleCancel();
      alert('질문이 성공적으로 수정되었습니다.');
    } catch (error) {
      alert('질문 수정에 실패했습니다. 수정 가능한 시간이 맞는지 확인해주세요.');
      console.error("Failed to save question:", error);
    }
  };

  const filterOptions = [
    { display: '전체', value: '전체' },
    { display: 'CS', value: '컴퓨터공학' },
    { display: '클라우드', value: '클라우드' },
    { display: '인공지능', value: '인공지능' },
  ];
  
  const filteredDailyQuestions = useMemo(() => {
    const monthDailyQuestions = dailyQuestions.filter(day => {
        const qDate = new Date(day.date);
        return qDate.getFullYear() === currentTime.getFullYear() && qDate.getMonth() === currentTime.getMonth();
    });

    if (activeFilter === '전체') {
        return monthDailyQuestions;
    }

    return monthDailyQuestions
        .map(day => ({
            ...day,
            questions: day.questions.filter(q => q.field === activeFilter),
        }))
        .filter(day => day.questions.length > 0);
  }, [dailyQuestions, currentTime, activeFilter]);

  const statusColors: { [key: string]: string } = { '전송 완료': 'bg-gray-200 text-gray-700', '수정 가능': 'bg-green-100 text-green-800', '수정 마감': 'bg-yellow-100 text-yellow-800', '생성 대기': 'bg-blue-100 text-blue-800' };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8">
      <div className="flex justify-between items-center flex-wrap mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 shrink-0">
          질문 관리 ({`${currentTime.getFullYear()}년 ${currentTime.getMonth() + 1}월`})
          <span className="text-lg font-medium text-gray-500 ml-4">
            {currentTime.toLocaleTimeString('ko-KR')}
          </span>
        </h1>
        <div className="flex gap-2 items-center">
            {filterOptions.map(option => (
                <Button 
                  key={option.value} 
                  onClick={() => setActiveFilter(option.value)} 
                  variant="ghost"
                  className={ activeFilter === option.value ? '!bg-main' : '' }
                  size="sm"
                >
                    {option.display}
                </Button>
            ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium w-40">전송 날짜</th>
              <th className="p-4 font-medium w-32">분야</th>
              <th className="p-4 font-medium">질문</th>
              <th className="p-4 font-medium w-32 text-center">상태</th>
              <th className="p-4 font-medium w-40 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredDailyQuestions.map(day => {
              const questionDate = new Date(day.date);
              const { status, isEditable } = getQuestionStatus(questionDate, currentTime);
              
              return (
                <Fragment key={day.date}>
                  {day.questions.map((question, index) => {
                    const isEditing = editingQuestionId === question.id;
                    return (
                      <tr key={question.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        {index === 0 && ( <td className="p-4 align-top font-medium" rowSpan={day.questions.length}> {questionDate.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })} </td> )}
                        <td className="p-4 align-top font-semibold text-gray-600">{question.field}</td>
                        <td className="p-4">
                          {isEditing ? ( <Textarea value={editedQuestionContent} onChange={(e) => setEditedQuestionContent(e.target.value)} className="min-h-[80px]" /> ) : ( <p className="text-gray-800">{question.content}</p> )}
                        </td>
                        <td className="p-4 align-top text-center">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status] || ''}`}> {status} </span>
                        </td>
                        <td className="p-4 align-top text-center">
                          {isEditing ? ( <div className="flex gap-2 justify-center"> <Button onClick={handleSave} size="sm">저장</Button> <Button onClick={handleCancel} size="sm" variant="outline">취소</Button> </div> ) : ( <Button onClick={() => handleEdit(question)} disabled={!isEditable} size="sm"> 수정 </Button> )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

