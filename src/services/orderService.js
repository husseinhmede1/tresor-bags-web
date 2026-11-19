import axios from 'axios';
import { withServerErrors } from './serverErrors';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = withServerErrors(axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
}));

export const createOrder = async (data) => {
    const res = await api.post('/orders', data);
    return res.data;
};

export const getAllOrders = async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
};

export const getStats = async (period = 'week') => {
    const res = await api.get('/stats', { params: { period } });
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

// Hands over what is ready now. Gives the updated order and what was sent this time.
export const deliverOrder = async (token) => {
    const res = await api.patch(`/orders/${token}/deliver`);
    return { order: res.data.data, sent: res.data.sent || [] };
};

// What paid orders are still waiting for, product by product.
export const getWaiting = async () => {
    const res = await api.get('/orders/waiting');
    return res.data.data || [];
};

export const cancelOrder = async (token) => {
    const res = await api.patch(`/orders/${token}/cancel`);
    return res.data.data;
};
