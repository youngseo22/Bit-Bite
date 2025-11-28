import { useState, useEffect, Fragment, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// --- Data Structure ---
type Question = {
  id: number;
  field: string;
  text: string;
};

type DailyQuestions = {
  date: string; // YYYY-MM-DD
  questions: Question[];
};

// Updated Mock Data with new fields
const mockDailyQuestions: DailyQuestions[] = [
    { date: '2025-11-27', questions: [ { id: 1, field: 'CS', text: '어제 CS 관련해서 가장 고민되었던 부분은 무엇인가요?' }, { id: 2, field: '클라우드', text: '어제 클라우드 관련해서 가장 행복했던 순간은 언제인가요?' }, { id: 3, field: '인공지능', text: '어제 AI와 관련해서 어떤 생각을 했나요?' }, ] },
    { date: '2025-11-28', questions: [ { id: 4, field: 'CS', text: '오늘 CS 스터디 중에 어떤 점을 개선하고 싶으신가요?' }, { id: 5, field: '클라우드', text: '오늘 클라우드 서비스에서 가장 만족스러운 부분은 무엇인가요?' }, { id: 6, field: '인공지능', text: '오늘 AI 모델을 사용하면서 어떤 것을 느꼈나요?' }, ] },
    { date: '2025-11-29', questions: [ { id: 7, field: 'CS', text: '내일 CS 기초를 위해 무엇을 할 계획인가요?' }, { id: 8, field: '클라우드', text: '내일 어떤 클라우드 기술을 더 배우고 싶으신가요?' }, { id: 9, field: '인공지능', text: '내일의 AI 관련 계획은 무엇인가요?' }, ] },
];


// --- Helper Functions ---
function getQuestionStatus(questionDate: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const qDate = new Date(questionDate.getFullYear(), questionDate.getMonth(), questionDate.getDate());
  const isToday = qDate.getTime() === today.getTime();
  const isTomorrow = qDate.getTime() === new Date(today.getTime() + 24 * 60 * 60 * 1000).getTime();

  if (qDate < today) return { status: '전송 완료', isEditable: false, isVisible: true };
  if (isToday) {
    if (now.getHours() * 60 + now.getMinutes() < 7 * 60 + 30) return { status: '수정 가능', isEditable: true, isVisible: true };
    if (now.getHours() < 8) return { status: '수정 마감', isEditable: false, isVisible: true };
    return { status: '전송 완료', isEditable: false, isVisible: true };
  }
  if (isTomorrow) {
    if (now.getHours() >= 8) return { status: '수정 가능', isEditable: true, isVisible: true };
    return { status: '생성 대기', isEditable: false, isVisible: false };
  }
  if (qDate > today) return { status: '생성 대기', isEditable: false, isVisible: false };
  return { status: '', isEditable: false, isVisible: false };
}

export function AdminPage() {
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestions[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('전체'); // Simplified to single filter

  useEffect(() => {
    setDailyQuestions(mockDailyQuestions);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEdit = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestionText(question.text);
  };

  const handleCancel = () => {
    setEditingQuestionId(null);
    setEditedQuestionText('');
  };

  const handleSave = () => {
    setDailyQuestions(dailyQuestions.map(day => ({ ...day, questions: day.questions.map(q => q.id === editingQuestionId ? { ...q, text: editedQuestionText } : q) })));
    handleCancel();
  };

  const filterCategories = ['전체', 'CS', '클라우드', '인공지능'];
  
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
            <span className='text-sm font-medium text-gray-600'>필터:</span>
            {filterCategories.map(field => (
                <Button 
                  key={field} 
                  onClick={() => setActiveFilter(field)} 
                  variant="outline"
                  className={activeFilter === field ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}
                  size="sm"
                >
                    {field}
                </Button>
            ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium w-40">날짜</th>
              <th className="p-4 font-medium w-32">분야</th>
              <th className="p-4 font-medium">질문</th>
              <th className="p-4 font-medium w-32 text-center">상태</th>
              <th className="p-4 font-medium w-40 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredDailyQuestions.map(day => {
              const questionDate = new Date(day.date);
              const { status, isEditable, isVisible } = getQuestionStatus(questionDate, currentTime);
              if (!isVisible) return null;

              return (
                <Fragment key={day.date}>
                  {day.questions.map((question, index) => {
                    const isEditing = editingQuestionId === question.id;
                    return (
                      <tr key={question.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        {index === 0 && ( <td className="p-4 align-top font-medium" rowSpan={day.questions.length}> {questionDate.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })} </td> )}
                        <td className="p-4 align-top font-semibold text-gray-600">{question.field}</td>
                        <td className="p-4">
                          {isEditing ? ( <Textarea value={editedQuestionText} onChange={(e) => setEditedQuestionText(e.target.value)} className="min-h-[80px]" /> ) : ( <p className="text-gray-800">{question.text}</p> )}
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

