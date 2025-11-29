// @ts-nocheck
import ky from 'ky'

export const api = ky.create({
    prefixUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    credentials: 'include',
    timeout: 180000,
    hooks: {
        beforeRequest: [
            request => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    request.headers.set('Authorization', `Bearer ${token}`);
                }
            }
        ],
        afterResponse: [
            async (request, options, response) => {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                }
            }
        ]
    }
  })

export type QuestionFromApi = {
  id: number;
  content: string;
  field: string;
  daily_question_date: string;
};

// Define the Token type for the adminLogin response
export type Token = {
  access_token: string;
  token_type: string;
};

  interface userInfo {
    username: string;
    password: string;
  }

  export const adminLogin = async (payload: userInfo): Promise<Token> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', payload.username);
      formData.append('password', payload.password);

      const response = await api.post('adminLogin', { body: formData });
      return await response.json<Token>();
    } catch (error) {
      console.error('Failed to admin login:', error);
      throw error;
    }
  };

export const getMonthQuestion = async (): Promise<QuestionFromApi[]> => {
  try {
    const response = await api.get('admin/questions/month').json<QuestionFromApi[]>();
    return response;
  } catch (error) {
    console.error('Failed to get month question:', error);
    throw error;
  }
}

export type QuestionFromApi = {
  id: number;
  content: string;
  field: string;
  daily_question_date: string;
};

export const putNextQuestion = async (questionId: number, newContent: string) => {
  try {
    const response = await api.put(`admin/questions/next-day/${questionId}`, {
      json: { new_content: newContent }
    }).json();
    return response;
  } catch (error) {
    console.error('Failed to update question:', error);
    throw error;
  }
};

  interface EmailVerificationPayload {
    email: string;
  }

  export const emailRequestVerification = async (payload: EmailVerificationPayload) => {
    try {
      const response = await api.post('email/request-verification', { json: payload }).json();
      return response;
    } catch (error) {
      console.error('Failed to request verification:', error);
      throw error;
    }
  };

  interface codeVerificationPayload {
    email: string;
    code: string;
  }

  export const codeVerification = async (payload: codeVerificationPayload) => {
    try {
      const response = await api.post('email/verify-code', { json: payload }).json();
      return response;
    } catch (error) {
      console.error('Failed to verify code:', error);
      throw error;
    }
  };

interface SubscribePayload {
  email: string;
  field: string;
}

export const subscribeToNewsletter = async (payload: SubscribePayload) => {
  try {
    const response = await api.post('subscribe', { json: payload }).json();
    return response;
  } catch (error) {
    console.error('Failed to subscribe:', error);
    throw error;
  }
};

export const getQuestion = async (question_id: number) => {
  try {
    const response = await api.get(`questions/${question_id}`).json();
    return response;
  } catch (error) {
    console.error('Failed to feedback:', error);
    throw error;
  }
};

export const generateQuestion = async () => {
  try {
    const response = await api.post('generate-question').json();
    return response;
  } catch (error) {
    console.error('Failed to question generate:', error);
    throw error;
  }
};

interface feedbackPayload {
  question_id: number;
  user_answer: string;
}

export const requestFeedback = async (payload: feedbackPayload) => {
  try {
    const response = await api.post('feedback', { json: payload }).json();
    return response;
  } catch (error) {
    console.error('Failed to feedback:', error);
    throw error;
  }
};
