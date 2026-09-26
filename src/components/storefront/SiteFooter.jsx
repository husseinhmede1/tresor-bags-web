import { Link } from "react-router-dom";
import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";

export default function SiteFooter() {
    return (
        <footer className="sf-footer">
            <div className="sf-container sf-footer__inner">
                <img src="/tresor_logo.webp" alt="Trésor Outlet Store" style={{ height: 40, width: 104, objectFit: "contain", objectPosition: "left center" }} />
                <nav className="sf-footer__links" aria-label="Contact and legal">
                    <a href="https://wa.me/96178987288" target="_blank" rel="noreferrer"><WhatsappLogo size={18} /> +961 78 987 288</a>
                    <a href="https://instagram.com/tre.sor_lb" target="_blank" rel="noreferrer"><InstagramLogo size={18} /> @tre.sor_lb</a>
                    <Link to="/privacy">Privacy</Link>
                </nav>
                <p className="sf-faint" style={{ fontSize: 13, width: "100%" }}>© {new Date().getFullYear()} Trésor Bags. Delivered across Lebanon.</p>
            </div>
        </footer>
    );
}
