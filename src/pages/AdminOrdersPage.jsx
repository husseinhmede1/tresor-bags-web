import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllOrders } from "../services/orderService";

const G = "#E5C48A", GD = "#C9A86A", BG = "#080808", CARD = "#0e0e0e", BORDER = "rgba(201,168,106,0.15)", MUTED = "#8A847C", TEXT = "#F5F1E8";
const SERIF = "'Cormorant Garamond', serif", SANS = "'Inter', sans-serif";

const STATUSES = [
    { k: "", label: "All" },
    { k: "pending", label: "Pending" },
    { k: "confirmed", label: "Confirmed" },
    { k: "cancelled", label: "Cancelled" },
];
const PERIODS = [
    { k: "all", label: "All time" },
    { k: "day", label: "Day" },
    { k: "week", label: "Week" },
    { k: "month", label: "Month" },
];
const STATUS_COLOR = { pending: "#D8B24A", confirmed: "#7BB07B", cancelled: "#C9807A" };

const money = (n) => "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => { try { return new Date(d).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

export default function AdminOrdersPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [sp] = useSearchParams();
    const [status, setStatus] = useState(sp.get("status") || "");
    const [period, setPeriod] = useState("all");
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ data: [], total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { setPage(1); }, [status, period]);

    useEffect(() => {
        setLoading(true); setError("");
        getAllOrders({ ...(status && { status }), period, page, limit: 20 })
            .then((res) => { if (res.success) setData(res); })
            .catch((e) => setError(e.message || "Failed to load orders"))
            .finally(() => setLoading(false));
    }, [status, period, page]);

    return (
        <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: SANS }}>
            <header style={S.header}>
                <div>
                    <p style={S.eyebrow}>Admin</p>
                    <h1 style={S.title}>Orders</h1>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <button style={S.linkBtn} onClick={() => navigate("/admin/stats")}>Statistics</button>
                    <button style={S.linkBtn} onClick={() => navigate("/admin/dashboard")}>Dashboard</button>
                    <button style={S.linkBtn} onClick={logout}>Logout</button>
                </div>
            </header>

            <main style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px 80px" }}>
                {/* Status tabs */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {STATUSES.map((s) => (
                        <button key={s.k} onClick={() => setStatus(s.k)} style={{ ...S.chip, ...(status === s.k ? S.chipActive : {}) }}>{s.label}</button>
                    ))}
                </div>
                {/* Period filter */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                    {PERIODS.map((p) => (
                        <button key={p.k} onClick={() => setPeriod(p.k)} style={{ ...S.chipSm, ...(period === p.k ? S.chipSmActive : {}) }}>{p.label}</button>
                    ))}
                </div>

                {error && <p style={{ color: "#C9957A", fontSize: 13 }}>{error}</p>}
                {loading ? (
                    <p style={{ color: MUTED, fontSize: 13, letterSpacing: "0.1em" }}>Loading…</p>
                ) : data.data.length === 0 ? (
                    <p style={{ color: MUTED, fontSize: 14, marginTop: 30 }}>No orders found.</p>
                ) : (
                    <>
                        <p style={{ color: MUTED, fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>{data.total} order{data.total === 1 ? "" : "s"}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {data.data.map((o) => {
                                const d = o.delivery || {};
                                const name = [d.name, d.surname].filter(Boolean).join(" ") || "—";
                                const phone = [d.phonePrefix, d.phoneNumber].filter(Boolean).join(" ");
                                const items = (o.items || []).reduce((n, it) => n + (it.quantity || 0), 0);
                                return (
                                    <div key={o._id} style={S.row} onClick={() => navigate(`/admin/order/${o.confirmToken}`)}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={S.rowName}>{name}</p>
                                            <p style={S.rowSub}>{phone || "no phone"} · {items} item{items === 1 ? "" : "s"} · {fmtDate(o.createdAt)}</p>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <p style={S.rowTotal}>{money(o.total)}</p>
                                            <span style={{ ...S.badge, color: STATUS_COLOR[o.status] || MUTED, borderColor: (STATUS_COLOR[o.status] || MUTED) + "55" }}>{o.status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {data.totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
                                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ ...S.pageBtn, opacity: page <= 1 ? 0.3 : 1 }}>← Prev</button>
                                <span style={{ fontSize: 12, color: MUTED }}>{page} / {data.totalPages}</span>
                                <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} style={{ ...S.pageBtn, opacity: page >= data.totalPages ? 0.3 : 1 }}>Next →</button>
                            </div>
                        )}
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
    chip: { padding: "8px 18px", background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 100, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS },
    chipActive: { background: "rgba(201,168,106,0.1)", borderColor: GD, color: G },
    chipSm: { padding: "5px 14px", background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 100, cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS },
    chipSmActive: { background: "rgba(201,168,106,0.08)", borderColor: GD, color: G },
    row: { display: "flex", alignItems: "center", gap: 14, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "14px 16px", cursor: "pointer" },
    rowName: { fontSize: 15, color: TEXT, margin: 0, fontFamily: SERIF, letterSpacing: "0.02em" },
    rowSub: { fontSize: 11, color: MUTED, margin: "4px 0 0", letterSpacing: "0.03em" },
    rowTotal: { fontSize: 15, color: G, margin: "0 0 6px", fontFamily: SERIF },
    badge: { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", border: "1px solid", borderRadius: 2, padding: "2px 7px" },
    pageBtn: { background: "transparent", border: `1px solid ${BORDER}`, color: TEXT, padding: "7px 16px", borderRadius: 100, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" },
};
