import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } });

export const getAllCollections = async (params = {}) => (await api.get('/collections', { params })).data;
export const getCollectionById = async (id)        => (await api.get(`/collections/${id}`)).data;
export const createCollection  = async (data)      => (await api.post('/collections', data)).data;
export const updateCollection  = async (id, data)  => (await api.put(`/collections/${id}`, data)).data;
export const deleteCollection  = async (id)        => (await api.delete(`/collections/${id}`)).data;
