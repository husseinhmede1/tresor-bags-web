import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Handbag } from "@phosphor-icons/react";
import { useCart } from "../../context/CartContext";

// Shared storefront header: logo (home), optional back button, extra actions, cart.
export default function SiteHeader({ back, children }) {
    const navigate = useNavigate();
    const { totalItems } = useCart();
    return (
        <header className="sf-header">
            <div className="sf-container sf-header__inner">
                <div className="sf-header__back">
                    {back && (
                        <button type="button" className="sf-icon-btn" onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))} aria-label="Back">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <Link to="/" aria-label="Trésor Bags home">
                        <img className="sf-header__logo" src="/tresor_logo.webp" alt="Trésor Outlet Store" />
                    </Link>
                </div>
                <div className="sf-header__right">
                    {children}
                    <button type="button" className="sf-icon-btn" onClick={() => navigate("/cart")} aria-label={`Shopping bag, ${totalItems} items`}>
                        <Handbag size={22} />
                        {totalItems > 0 && <span className="sf-badge">{totalItems > 99 ? "99+" : totalItems}</span>}
                    </button>
                </div>
            </div>
        </header>
    );
}
