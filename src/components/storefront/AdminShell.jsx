import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CaretDown, SignOut, Plus } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

// Shared frame for every admin page: same black and gold system as the storefront
// (storefront.css), with admin navigation. Pages pass their title and optional actions.
const NAV = [
    { to: "/admin/dashboard", label: "Bags" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/stats", label: "Stats" },
];
const ADD = [
    { to: "/admin/add", label: "Bag" },
    { to: "/admin/type/add", label: "Type" },
    { to: "/admin/collection/add", label: "Collection" },
];

export default function AdminShell({ title, subtitle, actions, width = 1120, children }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [addOpen, setAddOpen] = useState(false);
    const addRef = useRef(null);

    useEffect(() => {
        if (!addOpen) return;
        const close = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setAddOpen(false); };
        document.addEventListener("mousedown", close);
        document.addEventListener("touchstart", close);
        return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
    }, [addOpen]);

    return (
        <div className="sf">
            <style>{SHELL_CSS}</style>
            <header className="sf-header">
                <div className="sf-container sf-header__inner">
                    <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
                        <Link to="/admin/dashboard" aria-label="Admin home">
                            <img className="sf-header__logo" src="/tresor_logo.webp" alt="Trésor" />
                        </Link>
                        <nav className="adm-nav adm-nav--wide" aria-label="Admin">
                            {NAV.map(n => <NavLink key={n.to} to={n.to} className="adm-nav__link">{n.label}</NavLink>)}
                        </nav>
                    </div>
                    <div className="sf-header__right">
                        <div ref={addRef} style={{ position: "relative" }}>
                            <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => setAddOpen(o => !o)} aria-expanded={addOpen}>
                                <Plus size={14} weight="bold" /> Add <CaretDown size={12} />
                            </button>
                            {addOpen && (
                                <div className="adm-menu" role="menu">
                                    {ADD.map(a => (
                                        <button key={a.to} role="menuitem" onClick={() => { setAddOpen(false); navigate(a.to); }}>{a.label}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="sf-icon-btn" onClick={logout} aria-label="Log out" title="Log out"><SignOut size={20} /></button>
                    </div>
                </div>
                <nav className="sf-container adm-nav adm-nav--narrow" aria-label="Admin">
                    {NAV.map(n => <NavLink key={n.to} to={n.to} className="adm-nav__link">{n.label}</NavLink>)}
                </nav>
            </header>

            <main className="sf-container" style={{ maxWidth: width, paddingBlock: "32px 96px" }}>
                {(title || actions) && (
                    <div className="adm-head">
                        <div>
                            {title && <h1 className="sf-h2">{title}</h1>}
                            {subtitle && <p className="sf-faint" style={{ marginTop: 6, fontSize: 14 }}>{subtitle}</p>}
                        </div>
                        {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}

const SHELL_CSS = `
    .adm-nav { display: flex; gap: 4px; }
    .adm-nav__link { height: 36px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; color: var(--sf-text-2); text-decoration: none; font-size: 14px; font-weight: 500; white-space: nowrap; }
    .adm-nav__link:hover { color: var(--sf-text); background: rgba(255,255,255,0.05); }
    .adm-nav__link.active { color: var(--sf-text); background: var(--sf-surface-2); }
    .adm-nav--narrow { display: none; }
    .adm-menu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px; padding: 6px; border-radius: 16px; background: #161618; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 60px rgba(0,0,0,0.55); display: grid; z-index: 60; }
    .adm-menu button { text-align: left; height: 40px; padding: 0 12px; border-radius: 10px; border: 0; background: transparent; color: var(--sf-text); font: 500 14px/1 var(--sf-font); cursor: pointer; }
    .adm-menu button:hover { background: rgba(255,255,255,0.06); }
    .adm-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
    @media (max-width: 720px) {
        .adm-nav--wide { display: none; }
        .adm-nav--narrow { display: flex; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
    }
`;
