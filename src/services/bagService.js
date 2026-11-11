import axios from 'axios';
import { withServerErrors } from './serverErrors';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = withServerErrors(axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
}));

// Get all bags with pagination, search, and filters
export const getAllBags = async (params = {}) => {
    try {
        const response = await api.get('/bags', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Get single bag by ID
export const getBagById = async (id) => {
    try {
        const response = await api.get(`/bags/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Create a new bag (admin only)
export const createBag = async (bagData) => {
    try {
        const response = await api.post('/bags', bagData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Update a bag (admin only)
export const updateBag = async (id, bagData) => {
    try {
        const response = await api.put(`/bags/${id}`, bagData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Delete a bag (admin only)
export const deleteBag = async (id) => {
    try {
        const response = await api.delete(`/bags/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Videos go from the browser straight to ImageKit (too big to pass through our server).
// The server only signs each upload; `bagId` is the bag's id, or a new one for an unsaved bag.
export const getVideoUploadAuth = async (bagId) => (await api.post('/bags/video-upload', { bagId })).data.data;

const IMAGEKIT_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';

// Upload one file into the signed folder. `unique: false` keeps the exact name (used for a
// video's cover, which is named after its video so the site can find it).
export const uploadVideoFile = async (file, auth, { onProgress, signal, fileName, unique = true } = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('fileName', fileName || (file.name || 'video.mp4').replace(/[^\w.-]+/g, '_').slice(-80));
    form.append('folder', auth.folder);
    form.append('useUniqueFileName', unique ? 'true' : 'false');
    form.append('publicKey', auth.publicKey);
    form.append('signature', auth.signature);
    form.append('expire', String(auth.expire));
    form.append('token', auth.token);
    try {
        const { data } = await axios.post(IMAGEKIT_UPLOAD, form, {
            signal,
            onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
        });
        if (!data?.url) throw new Error('Upload failed');
        return data.url;
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        throw new Error(error.response?.data?.message || error.message || 'Upload failed', { cause: error });
    }
};

// Admin settings shared by every device (e.g. the video quality chosen on the test page).
export const getSettings = async () => (await api.get('/settings')).data.data;
export const saveSettings = async (data) => (await api.put('/settings', data)).data.data;

export default api;
