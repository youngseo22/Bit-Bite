import ky from 'ky'

export const api = ky.create({
    prefixUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',
  })

interface SubscribePayload {
  email: string;
  field: string;
}

export const subscribeToNewsletter = async (payload: SubscribePayload) => {
  try {
    const response = await api.post('subscribers/', { json: payload }).json();
    return response;
  } catch (error) {
    console.error('Failed to subscribe:', error);
    throw error;
  }
};