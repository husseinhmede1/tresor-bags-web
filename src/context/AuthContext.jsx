import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(() => {
        const stored = localStorage.getItem("isAdmin");
        return stored ? JSON.parse(stored) : false;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if already logged in on mount
    useEffect(() => {
        const stored = localStorage.getItem("isAdmin");
        if (stored) {
            setIsAdmin(JSON.parse(stored));
        }
    }, []);

    const login = (password) => {
        setLoading(true);
        setError("");
        
        // Replace with real API call to authenticate
        // For now, using hardcoded password for demo
        if (password === "admin123") {
            setIsAdmin(true);
            localStorage.setItem("isAdmin", JSON.stringify(true));
            localStorage.setItem("adminToken", "mock-token-" + Date.now());
            setLoading(false);
            return true;
        }
        
        setError("Invalid credentials");
        setLoading(false);
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminToken");
        setError("");
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);