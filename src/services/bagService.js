import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get all bags with pagination, search, and filters
export const getAllBags = async (params = {}) => {
    try {
        const response = await api.get('/bags', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get single bag by ID
export const getBagById = async (id) => {
    try {
        const response = await api.get(`/bags/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Create a new bag (admin only)
export const createBag = async (bagData) => {
    try {
        const response = await api.post('/bags', bagData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Update a bag (admin only)
export const updateBag = async (id, bagData) => {
    try {
        const response = await api.put(`/bags/${id}`, bagData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Delete a bag (admin only)
export const deleteBag = async (id) => {
    try {
        const response = await api.delete(`/bags/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default api;
