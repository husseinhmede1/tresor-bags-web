import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

export const createOrder = async (data) => {
    const res = await api.post('/orders', data);
    return res.data;
};

export const getOrderByToken = async (token) => {
    const res = await api.get(`/orders/${token}`);
    return res.data.data;
};

export const confirmOrder = async (token) => {
    const res = await api.patch(`/orders/${token}/confirm`);
    return res.data.data;
};

export const cancelOrder = async (token) => {
    const res = await api.patch(`/orders/${token}/cancel`);
    return res.data.data;
};
