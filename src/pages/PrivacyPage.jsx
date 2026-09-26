import { useNavigate } from "react-router-dom";

const GOLD_L = "#E5C48A";
const TEXT   = "#F5F1E8";
const SOFT   = "#A39A90";
const BORDER = "rgba(201,168,106,0.15)";
const SERIF  = "'Cormorant Garamond', serif";
const SANS   = "'Inter', system-ui, sans-serif";

const EN = [
    ["What we collect", "When you order: your name, phone, email, delivery address and map location, and the items you chose."],
    ["Why", "Only to confirm, deliver and follow up on your order, including over WhatsApp. We never sell or share it for marketing."],
    ["Payment", "You pay by Whish transfer in the Whish app. We don't see or store any card details."],
    ["Shopping assistant", "Questions and photos you send to the assistant are processed by Google's AI to answer you. Please don't include personal details."],
    ["Your browser", "Your cart and a few preferences are saved in your own browser."],
    ["Your data", "To see or delete your information, message us on WhatsApp at +961\u00A078\u00A0987\u00A0288."],
];

const AR = [
    ["شو منجمع", "وقت الطلب: الاسم، الرقم، الإيميل، عنوان وموقع التوصيل، والشنط اللي اخترتها."],
    ["ليش", "بس لنأكد طلبك ونوصّلو ونتابع معك، ومنها عالواتساب. ما منبيعها ولا منعطيها لحدا للإعلانات."],
    ["الدفع", "الدفع بتحويل Whish من تطبيق Whish. نحنا ما منشوف ولا منحفظ أي معلومات بطاقة."],
    ["المساعد الذكي", "الأسئلة والصور اللي بتبعتها للمساعد بتنعالج بالذكاء الاصطناعي تبع Google ليجاوبك. ما تحط معلومات شخصية فيها."],
    ["متصفحك", "السلّة وكم إعداد بينحفظوا بمتصفحك."],
    ["معلوماتك", "لتشوف معلوماتك أو تمحيها، راسلنا عالواتساب ‎+961\u00A078\u00A0987\u00A0288."],
];

const Section = ({ items, dir }) => (
    <dl dir={dir} style={{ margin: 0, display: "grid", gap: 18 }}>
        {items.map(([k, v]) => (
            <div key={k}>
                <dt style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: GOLD_L, marginBottom: 4 }}>{k}</dt>
                <dd style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.7, color: TEXT, maxWidth: "62ch" }}>{v}</dd>
            </div>
        ))}
    </dl>
);

export default function PrivacyPage() {
    const navigate = useNavigate();
    return (
        <main style={{ minHeight: "100dvh", background: "#080808", padding: "48px 20px 72px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <button onClick={() => navigate(-1)} aria-label="Back"
                    style={{ background: "none", border: `1px solid ${BORDER}`, color: SOFT, width: 36, height: 36, borderRadius: 2, cursor: "pointer", marginBottom: 32 }}>
                    ←
                </button>
                <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2rem, 5vw, 2.8rem)", lineHeight: 1.15, color: GOLD_L, margin: "0 0 8px" }}>
                    Privacy Policy
                </h1>
                <p style={{ fontFamily: SANS, fontSize: 12, color: SOFT, margin: "0 0 36px" }}>Trésor Bags. Last updated September 2026.</p>

                <Section items={EN} dir="ltr" />
                <div style={{ height: 1, background: BORDER, margin: "40px 0" }} />
                <Section items={AR} dir="rtl" />
            </div>
        </main>
    );
}
