import ky from 'ky'

export const api = ky.create({
    prefixUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',
  })