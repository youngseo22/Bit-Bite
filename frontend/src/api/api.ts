import ky from 'ky'

export const api = ky.create({
    prefixUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',
  })

  interface EmailVerificationPayload {
    email: string;
  }

  export const emailRequestVerification = async (payload: EmailVerificationPayload) => {
    try {
      const response = await api.post('email/request-verification', { json: payload }).json();
      return response;
    } catch (error) {
      console.error('Failed to subscribe:', error);
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
      console.error('Failed to subscribe:', error);
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
