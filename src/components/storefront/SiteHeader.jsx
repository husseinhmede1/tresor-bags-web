import { Link, useNavigate } from "react-router-dom";
import { useGoBack } from "../../utils/goBack";
import { ArrowLeft, Handbag } from "@phosphor-icons/react";
import { useCart } from "../../context/CartContext";
import ShopMenu from "./ShopMenu";

// Shared storefront header: logo (home), optional back button, the shop menu, extra actions, cart.
// `back`: show the arrow. It returns to the page the visitor came from; given as an address,
// that is where someone who opened this page first is sent.
export default function SiteHeader({ back, children }) {
    const navigate = useNavigate();
    const goBack = useGoBack();
    const { totalItems } = useCart();
    return (
        <header className="sf-header">
            <div className="sf-container sf-header__inner">
                <div className="sf-header__back">
                    {back && (
                        <button type="button" className="sf-icon-btn" onClick={() => goBack(typeof back === "string" ? back : "/")} aria-label="Back">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <Link to="/" aria-label="Trésor Bags home">
                        <img className="sf-header__logo" src="/tresor_logo.webp" alt="Trésor Outlet Store" />
                    </Link>
                </div>
                <ShopMenu />
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
