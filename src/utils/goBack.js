import { useLocation, useNavigate } from "react-router-dom";

// "Back" and "Cancel" return to the page the visitor came from, exactly as the browser's own
// back button does: the list they were on, at the page and place they left it.
// Someone who opened this page first (a shared link, a bookmark) has nowhere on the site to go
// back to: they are sent to `fallback` instead.
export const useGoBack = () => {
    const navigate = useNavigate();
    const { key } = useLocation();
    return (fallback = "/") => (key !== "default" ? navigate(-1) : navigate(fallback, { replace: true }));
};
