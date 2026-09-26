// Show the server's own reason ("Title is required", "Order is cancelled"…) instead of
// axios's generic "Request failed with status code 400". The error object is kept as is.
export const withServerErrors = (api) => {
    api.interceptors.response.use(null, (error) => {
        const message = error.response?.data?.message;
        if (message) error.message = message;
        return Promise.reject(error);
    });
    return api;
};
