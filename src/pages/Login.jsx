import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/admin/dashboard";
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Already logged in → go to intended destination
    if (isAdmin) {
        navigate(from, { replace: true });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const success = login(password);
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError("Invalid credentials. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                {/* Logo / Brand */}
                <div style={styles.brand}>
                    <h1 style={styles.brandName}>TRÉSOR BAGS</h1>
                    <p style={styles.brandSub}>Admin Portal</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Admin Password</label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                style={styles.input}
                                required
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.togglePasswordBtn}
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button 
                        type="submit" 
                        style={styles.button} 
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={styles.back}>
                    <a href="/" style={styles.backLink}>
                        ← Back to Store
                    </a>
                </p>
            </div>

            {/* Decorative Elements */}
            <div style={styles.decoration1}></div>
            <div style={styles.decoration2}></div>
        </div>
    );
};

const styles = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        color: "#F5F1E8",
    },
    decoration1: {
        position: "absolute",
        top: "-10%",
        left: "-5%",
        width: "520px",
        height: "520px",
        background: "radial-gradient(circle, rgba(201,168,106,0.24) 0%, transparent 62%)",
        borderRadius: "50%",
        pointerEvents: "none",
        filter: "blur(18px)",
    },
    decoration2: {
        position: "absolute",
        bottom: "-15%",
        right: "-10%",
        width: "520px",
        height: "520px",
        background: "radial-gradient(circle, rgba(229,196,138,0.18) 0%, transparent 65%)",
        borderRadius: "50%",
        pointerEvents: "none",
        filter: "blur(18px)",
    },
    card: {
        background: "rgba(18, 18, 18, 0.98)",
        borderRadius: "28px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 40px 120px rgba(0,0,0,0.35)",
        position: "relative",
        zIndex: 10,
        animation: "slideInUp 0.6s ease-out",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    brand: {
        textAlign: "center",
        marginBottom: "36px",
    },
    brandName: {
        fontSize: "34px",
        fontWeight: 800,
        letterSpacing: "0.18em",
        color: "#E5C48A",
        margin: 0,
        fontFamily: "'Cormorant Garamond', serif",
        textTransform: "uppercase",
    },
    brandSub: {
        fontSize: "13px",
        color: "#A7A19A",
        marginTop: "10px",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        fontWeight: 600,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#A7A19A",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
    },
    passwordWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    input: {
        width: "100%",
        padding: "16px 18px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "#F5F1E8",
        fontSize: "15px",
        outline: "none",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    togglePasswordBtn: {
        position: "absolute",
        right: "16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        padding: "4px 8px",
        color: "#E5C48A",
    },
    error: {
        color: "#F5F1E8",
        fontSize: "13px",
        margin: 0,
        padding: "12px 14px",
        background: "rgba(184,58,58,0.15)",
        borderRadius: "12px",
        border: "1px solid rgba(184,58,58,0.35)",
    },
    button: {
        padding: "14px",
        background: "linear-gradient(135deg, #C9A86A 0%, #E5C48A 100%)",
        color: "#080808",
        border: "none",
        borderRadius: "999px",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.08em",
        transition: "all 0.3s ease",
        boxShadow: "0 20px 30px rgba(201,168,106,0.24)",
        marginTop: "8px",
    },
    hint: {
        padding: "14px 16px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "14px",
        marginTop: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    hintText: {
        fontSize: "13px",
        color: "#A7A19A",
        margin: 0,
    },
    code: {
        background: "rgba(255,255,255,0.08)",
        padding: "3px 8px",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontWeight: 600,
        color: "#F5F1E8",
    },
    back: {
        textAlign: "center",
        marginTop: "30px",
        marginBottom: 0,
    },
    backLink: {
        color: "#E5C48A",
        fontSize: "13px",
        textDecoration: "none",
        transition: "all 0.3s ease",
    },
};

export default Login;