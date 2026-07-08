import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStats } from "../services/orderService";

const G = "#E5C48A", GD = "#C9A86A", BG = "#080808", CARD = "#0e0e0e", BORDER = "rgba(201,168,106,0.15)", MUTED = "#8A847C", TEXT = "#F5F1E8";
const SERIF = "'Cormorant Garamond', serif", SANS = "'Inter', sans-serif";
const PERIODS = [{ k: "day", label: "Day" }, { k: "week", label: "Week" }, { k: "month", label: "Month" }];

const money = (n) => "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminStatsPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [period, setPeriod] = useState("week");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true); setError("");
        getStats(period)
            .then((res) => { if (res.success) setStats(res); })
            .catch((e) => setError(e.message || "Failed to load stats"))
            .finally(() => setLoading(false));
    }, [period]);

    const k = stats?.kpis || {};
    const series = stats?.timeseries || [];
    const maxRev = Math.max(1, ...series.map((s) => s.revenue));
    const kpiCards = [
        { label: "Revenue", value: money(k.revenue), hint: "from confirmed sales" },
        { label: "Confirmed Orders", value: k.confirmedOrders ?? 0 },
        { label: "Avg Order Value", value: money(k.avgOrderValue) },
        { label: "Discounts Given", value: money(k.discountsGiven) },
        { label: "Pending", value: k.pendingOrders ?? 0, hint: "needs action", action: () => navigate("/admin/orders?status=pending") },
        { label: "Cancelled", value: k.cancelledOrders ?? 0 },
    ];

    return (
        <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: SANS }}>
            <header style={S.header}>
                <div>
                    <p style={S.eyebrow}>Admin</p>
                    <h1 style={S.title}>Statistics</h1>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <button style={S.linkBtn} onClick={() => navigate("/admin/orders")}>Orders</button>
                    <button style={S.linkBtn} onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
                    <button style={S.linkBtn} onClick={logout}>Logout</button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "28px auto", padding: "0 18px 80px" }}>
                {/* Period toggle */}
                <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
                    {PERIODS.map((p) => (
                        <button key={p.k} onClick={() => setPeriod(p.k)}
                            style={{ ...S.periodBtn, ...(period === p.k ? S.periodBtnActive : {}) }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {error && <p style={{ color: "#C9957A", fontSize: 13 }}>{error}</p>}
                {loading ? (
                    <p style={{ color: MUTED, fontSize: 13, letterSpacing: "0.1em" }}>Loading…</p>
                ) : (
                    <>
                        {/* KPI grid */}
                        <div style={S.kpiGrid}>
                            {kpiCards.map((c) => (
                                <div key={c.label} style={{ ...S.kpiCard, ...(c.action ? { cursor: "pointer" } : {}) }} onClick={c.action}>
                                    <p style={S.kpiLabel}>{c.label}</p>
                                    <p style={S.kpiValue}>{c.value}</p>
                                    {c.hint && <p style={S.kpiHint}>{c.hint}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Revenue chart */}
                        <section style={S.panel}>
                            <h2 style={S.panelTitle}>Revenue</h2>
                            {series.length === 0 ? (
                                <p style={S.empty}>No confirmed sales in this period.</p>
                            ) : (
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, marginTop: 18 }}>
                                    {series.map((s) => (
                                        <div key={s.bucket} title={`${s.bucket} · ${money(s.revenue)} · ${s.orders} orders`}
                                            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
                                            <div style={{ width: "100%", maxWidth: 34, height: `${Math.round((s.revenue / maxRev) * 150)}px`, minHeight: 2, background: `linear-gradient(to top, ${GD}, ${G})`, borderRadius: "2px 2px 0 0" }} />
                                            <span style={{ fontSize: 8, color: MUTED, whiteSpace: "nowrap", transform: "rotate(0deg)" }}>{s.bucket.slice(5)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Top sellers */}
                        <section style={S.panel}>
                            <h2 style={S.panelTitle}>Best Sellers</h2>
                            {(stats?.topSellers || []).length === 0 ? (
                                <p style={S.empty}>No sales yet.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
                                    {stats.topSellers.map((b, i) => (
                                        <div key={b.title + i} style={S.sellerRow}>
                                            <span style={{ color: GD, fontSize: 12, width: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                                            <span style={{ flex: 1, fontSize: 14, color: TEXT }}>{b.title}</span>
                                            <span style={{ fontSize: 12, color: MUTED, width: 70, textAlign: "right" }}>{b.quantity} sold</span>
                                            <span style={{ fontSize: 13, color: G, width: 90, textAlign: "right" }}>{money(b.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

const S = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: `1px solid ${BORDER}`, background: "rgba(8,8,8,0.96)", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" },
    eyebrow: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, margin: "0 0 4px" },
    title: { fontFamily: SERIF, fontSize: 24, color: G, letterSpacing: "0.08em", margin: 0 },
    linkBtn: { background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" },
    periodBtn: { padding: "8px 20px", background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 100, cursor: "pointer", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: SANS },
    periodBtnActive: { background: "rgba(201,168,106,0.1)", borderColor: GD, color: G },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 24 },
    kpiCard: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "16px 18px" },
    kpiLabel: { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" },
    kpiValue: { fontFamily: SERIF, fontSize: 26, color: TEXT, margin: 0, letterSpacing: "0.02em" },
    kpiHint: { fontSize: 9, color: GD, letterSpacing: "0.1em", textTransform: "uppercase", margin: "6px 0 0" },
    panel: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "20px 20px 24px", marginBottom: 18 },
    panelTitle: { fontFamily: SERIF, fontSize: 18, color: G, margin: 0, letterSpacing: "0.05em" },
    empty: { color: MUTED, fontSize: 13, margin: "14px 0 0" },
    sellerRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` },
};
