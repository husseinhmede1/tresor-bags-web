import axios from 'axios';
import { withServerErrors } from './serverErrors';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = withServerErrors(axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } }));

// Returns { token, expiresInDays }; throws with the server's message on failure.
export const loginAdmin = async (password) => (await api.post('/auth/login', { password })).data.data;

// Resolves if the stored token is still valid (a 401 logs out via the interceptor).
export const checkAdmin = async () => (await api.get('/auth/check')).data;
