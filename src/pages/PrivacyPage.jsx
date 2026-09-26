import { usePageMeta } from "../utils/pageMeta";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";

const EN = [
    ["What we collect", "When you order: your name, phone, email, delivery address and map location, and the items you chose."],
    ["Why", "Only to confirm, deliver and follow up on your order, including over WhatsApp. We never sell or share it for marketing."],
    ["Payment", "You pay by Whish transfer in the Whish app. We don't see or store any card details."],
    ["Shopping assistant", "Questions and photos you send to the assistant are processed by Google's AI to answer you. Please don't include personal details."],
    ["Your browser", "Your cart and a few preferences are saved in your own browser."],
    ["Your data", "To see or delete your information, message us on WhatsApp at +961\u00A078\u00A0987\u00A0288."],
];


export default function PrivacyPage() {
    usePageMeta({
        title: "Privacy Policy | Trésor Bags",
        description: "How Trésor Bags uses the details you share when you order or use the shopping assistant.",
        url: "https://tresorbags.com/privacy",
    });
    return (
        <div className="sf">
            <SiteHeader back />
            <main className="sf-container" style={{ maxWidth: 760, paddingBlock: "40px 24px" }}>
                <h1 className="sf-h2" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>Privacy Policy</h1>
                <p className="sf-faint" style={{ marginTop: 8, fontSize: 14 }}>Last updated September 2026</p>
                <dl style={{ margin: "40px 0 0", display: "grid", gap: 28 }}>
                    {EN.map(([k, v]) => (
                        <div key={k} style={{ display: "grid", gap: 6 }}>
                            <dt className="sf-h3" style={{ fontSize: 17 }}>{k}</dt>
                            <dd className="sf-muted" style={{ margin: 0, lineHeight: 1.7, maxWidth: "62ch" }}>{v}</dd>
                        </div>
                    ))}
                </dl>
            </main>
            <SiteFooter />
        </div>
    );
}
