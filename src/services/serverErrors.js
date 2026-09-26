// Shared axios setup for every API client:
// - sends the admin token (if logged in) so the server allows admin actions;
// - if the server says the token is no longer valid, logs the admin out;
// - shows the server's own reason ("Title is required", "Order is cancelled"...) instead of
//   axios's generic "Request failed with status code 400". The error object is kept as is.
export const TOKEN_KEY = "adminToken";
export const AUTH_EXPIRED = "tresor-auth-expired";

export const withServerErrors = (api) => {
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
    api.interceptors.response.use(null, (error) => {
        if (error.response?.status === 401 && error.config?.headers?.Authorization) {
            localStorage.removeItem(TOKEN_KEY);
            window.dispatchEvent(new Event(AUTH_EXPIRED));
        }
        const message = error.response?.data?.message;
        if (message) error.message = message;
        return Promise.reject(error);
    });
    return api;
};
