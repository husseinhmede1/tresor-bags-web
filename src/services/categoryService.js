import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

export const getAllCategories = async (params = {}) => {
    try {
        const response = await api.get('/categories', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getCategoryById = async (id) => {
    try {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createCategory = async (data) => {
    try {
        const response = await api.post('/categories', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateCategory = async (id, data) => {
    try {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
