import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeSlash, ArrowLeft, CircleNotch } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login, isAdmin, error: authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/admin/dashboard";
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Already logged in: go to intended destination
    if (isAdmin) {
        navigate(from, { replace: true });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const success = await login(password);
        setLoading(false);
        if (success) navigate(from, { replace: true });
        else setError("failed");
    };

    return (
        <div className="sf lg">
            <style>{LOGIN_CSS}</style>
            <main className="lg__card">
                <img className="lg__logo" src="/tresor_logo.webp" alt="Trésor" />
                <h1 className="sf-h3 lg__title">Admin login</h1>

                <form onSubmit={handleSubmit} className="lg__form">
                    <div className="sf-field">
                        <label className="sf-label" htmlFor="admin-password">Password</label>
                        <div className="lg__pw">
                            <input
                                id="admin-password"
                                className="sf-input"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                autoComplete="current-password"
                                aria-invalid={error ? "true" : undefined}
                                aria-describedby={error ? "login-error" : undefined}
                                required
                                autoFocus
                            />
                            <button
                                type="button"
                                className="sf-icon-btn lg__toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {error && (
                            <p id="login-error" className="sf-error" role="alert">
                                {authError || "Could not log in, please try again."}
                            </p>
                        )}
                    </div>

                    <button type="submit" className="sf-btn sf-btn--primary sf-btn--block" disabled={loading} aria-busy={loading}>
                        {loading ? <><CircleNotch size={18} className="lg__spin" /> Logging in</> : "Log in"}
                    </button>
                </form>

                <a href="/" className="lg__back">
                    <ArrowLeft size={14} /> Back to the shop
                </a>
            </main>
        </div>
    );
};

const LOGIN_CSS = `
    .lg { display: grid; place-items: center; padding: 40px 16px; }
    .lg__card { width: 100%; max-width: 400px; display: grid; justify-items: center; }
    .lg__logo { height: 56px; width: 140px; object-fit: contain; }
    .lg__title { margin-top: 20px !important; font-size: 1.375rem; }
    .lg__form { width: 100%; display: grid; gap: 20px; margin-top: 28px; padding: clamp(20px, 5vw, 28px); background: var(--sf-surface); border: 1px solid var(--sf-line); border-radius: var(--sf-r-panel); }
    .lg__pw { position: relative; }
    .lg__pw .sf-input { padding-right: 52px; }
    .lg__form .sf-input { background: var(--sf-bg); }
    .lg__form .sf-input:focus { background: var(--sf-surface-2); }
    .lg__toggle { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: var(--sf-text-2); }
    .lg__toggle:hover { color: var(--sf-text); }
    .lg__spin { animation: sfSpin 0.9s linear infinite; }
    .lg__back { margin-top: 24px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--sf-text-2) !important; text-decoration: none; }
    .lg__back:hover { color: var(--sf-text) !important; }
    @media (prefers-reduced-motion: reduce) { .lg__spin { animation: none; } }
`;

export default Login;
