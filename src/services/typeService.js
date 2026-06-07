import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } });

export const getAllTypes    = async ()       => (await api.get('/types')).data;
export const getTypeById   = async (id)     => (await api.get(`/types/${id}`)).data;
export const createType    = async (data)   => (await api.post('/types', data)).data;
export const updateType    = async (id, d)  => (await api.put(`/types/${id}`, d)).data;
export const deleteType    = async (id)     => (await api.delete(`/types/${id}`)).data;
