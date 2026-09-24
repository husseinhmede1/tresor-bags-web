import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: `${API_URL}/api`, headers: { 'Content-Type': 'application/json' } });

// images: array of data-URL strings (one bag, one or more chat screenshots)
export const parseProductFromChat = async ({ images, text, language }) => {
    try {
        return (await api.post('/ai/parse-product', { images, text, language })).data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};
