import axios from 'axios';
import { withServerErrors } from './serverErrors';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = withServerErrors(axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } }));

// Admin only: the facts the shop assistant answers from, and the questions it could not answer.
export const getInfo          = async ()           => (await api.get('/info')).data;
export const createInfo       = async (data)       => (await api.post('/info', data)).data;
export const updateInfo       = async (id, data)   => (await api.put(`/info/${id}`, data)).data;
export const deleteInfo       = async (id)         => (await api.delete(`/info/${id}`)).data;
export const getUnanswered    = async (status)     => (await api.get('/info/unanswered', { params: { status } })).data;
export const setQuestionState = async (id, status) => (await api.patch(`/info/unanswered/${id}`, { status })).data;
