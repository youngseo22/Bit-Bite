import ky from 'ky'

export const api = ky.create({
    prefixUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',
    timeout: 180000,
  })

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