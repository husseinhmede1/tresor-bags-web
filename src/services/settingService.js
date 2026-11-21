import axios from 'axios';
import { withServerErrors } from './serverErrors';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = withServerErrors(axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } }));

// Admin only: what the shop chose for the site itself (today, the occasion it is decorated for).
export const getSettings  = async ()     => (await api.get('/settings')).data.data;
export const saveSettings = async (data) => (await api.put('/settings', data)).data.data;
