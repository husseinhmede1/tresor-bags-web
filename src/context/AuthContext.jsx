import { createContext, useContext, useState, useEffect } from "react";
import { loginAdmin, checkAdmin } from "../services/authService";
import { TOKEN_KEY, AUTH_EXPIRED } from "../services/serverErrors";

const AuthContext = createContext(null);

// The password is checked by the server, which returns a signed token that expires.
// Every admin API call sends that token; the server refuses admin actions without it.
export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        localStorage.removeItem("isAdmin"); // leftover from the old browser-only login
        // Expired or revoked token (e.g. the password was changed): drop to the login page.
        const expire = () => setIsAdmin(false);
        window.addEventListener(AUTH_EXPIRED, expire);
        if (localStorage.getItem(TOKEN_KEY)) checkAdmin().catch(() => {});
        return () => window.removeEventListener(AUTH_EXPIRED, expire);
    }, []);

    const login = async (password) => {
        setLoading(true);
        setError("");
        try {
            const { token } = await loginAdmin(password);
            localStorage.setItem(TOKEN_KEY, token);
            setIsAdmin(true);
            return true;
        } catch (err) {
            setError(err.response?.status === 401 ? "Invalid credentials. Please try again." : (err.message || "Could not log in"));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem(TOKEN_KEY);
        setError("");
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
