import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CaretLeft, CaretRight, Receipt } from "@phosphor-icons/react";
import { getAllOrders } from "../services/orderService";
import AdminShell from "../components/storefront/AdminShell";

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
const STATUS_LABEL = { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled" };

const money = (n) => "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => { try { return new Date(d).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

export default function AdminOrdersPage() {
    const navigate = useNavigate();
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

    const subtitle = loading ? "Loading orders" : `${data.total} order${data.total === 1 ? "" : "s"}`;

    return (
        <AdminShell title="Orders" subtitle={subtitle} width={1000}>
            <style>{ORDERS_CSS}</style>

            <div className="aos-filters">
                <div className="sf-seg aos-seg" role="group" aria-label="Filter by status">
                    {STATUSES.map((s) => (
                        <button key={s.k} type="button" aria-pressed={status === s.k} onClick={() => setStatus(s.k)}>{s.label}</button>
                    ))}
                </div>
                <div className="sf-chips" role="group" aria-label="Filter by period">
                    {PERIODS.map((p) => (
                        <button key={p.k} type="button" className="sf-chip" aria-pressed={period === p.k} onClick={() => setPeriod(p.k)}>{p.label}</button>
                    ))}
                </div>
            </div>

            {error && <p className="sf-error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

            {loading ? (
                <div className="aos-list" aria-busy="true" aria-label="Loading orders">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aos-skelrow">
                            <div style={{ display: "grid", gap: 8, flex: 1 }}>
                                <div className="sf-skel" style={{ height: 16, width: "40%" }} />
                                <div className="sf-skel" style={{ height: 12, width: "60%" }} />
                            </div>
                            <div className="sf-skel" style={{ height: 26, width: 84, borderRadius: 999 }} />
                        </div>
                    ))}
                </div>
            ) : data.data.length === 0 ? (
                <div className="sf-panel aos-empty">
                    <Receipt size={40} color="#8C867E" />
                    <h2 className="sf-h3">No orders found</h2>
                    <p className="sf-muted" style={{ maxWidth: "36ch" }}>Try another status or a longer period.</p>
                </div>
            ) : (
                <>
                    <ul className="aos-list">
                        {data.data.map((o) => {
                            const d = o.delivery || {};
                            const name = [d.name, d.surname].filter(Boolean).join(" ") || "Name not given";
                            const phone = d.phoneNumber ? [d.phonePrefix, d.phoneNumber].filter(Boolean).join(" ") : "";
                            const items = (o.items || []).reduce((n, it) => n + (it.quantity || 0), 0);
                            return (
                                <li key={o._id}>
                                    <button type="button" className="sf-row aos-row" onClick={() => navigate(`/admin/order/${o.confirmToken}`)}>
                                        <div style={{ minWidth: 0 }}>
                                            <p className="aos-name">{name}</p>
                                            <p className="aos-sub sf-num">
                                                <span>{fmtDate(o.createdAt)}</span>
                                                <span>{items} item{items === 1 ? "" : "s"}</span>
                                                {phone && <span className="aos-phone">{phone}</span>}
                                            </p>
                                        </div>
                                        <div className="aos-end">
                                            <span className="sf-num aos-total">{money(o.total)}</span>
                                            <span className={`sf-status sf-status--${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                                        </div>
                                        <CaretRight size={16} className="aos-chev" aria-hidden="true" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {data.totalPages > 1 && (
                        <nav className="aos-pager" aria-label="Pagination">
                            <button className="sf-btn sf-btn--ghost sf-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                <CaretLeft size={14} /> Previous
                            </button>
                            <span className="sf-faint sf-num" style={{ fontSize: 14 }}>Page {page} of {data.totalPages}</span>
                            <button className="sf-btn sf-btn--ghost sf-btn--sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                                Next <CaretRight size={14} />
                            </button>
                        </nav>
                    )}
                </>
            )}
        </AdminShell>
    );
}

const ORDERS_CSS = `
    .aos-filters { display: grid; gap: 12px; margin-bottom: 24px; }
    .aos-seg { max-width: 100%; overflow-x: auto; scrollbar-width: none; width: fit-content; }
    .aos-seg::-webkit-scrollbar { display: none; }
    .aos-seg button { flex-shrink: 0; }
    .aos-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .aos-row { grid-template-columns: minmax(0, 1fr) auto auto; }
    .aos-name { font-size: 16px; font-weight: 550; letter-spacing: -0.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .aos-sub { margin-top: 4px; font-size: 13.5px; color: var(--sf-text-3); display: flex; flex-wrap: wrap; column-gap: 14px; row-gap: 2px; }
    .aos-end { display: grid; justify-items: end; gap: 6px; }
    .aos-total { font-weight: 600; font-size: 16px; }
    .aos-chev { color: var(--sf-text-3); }
    .aos-skelrow { display: flex; align-items: center; gap: 16px; padding: 18px; border-radius: 16px; background: var(--sf-surface); border: 1px solid var(--sf-line); }
    .aos-empty { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 56px 24px; }
    .aos-pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 28px; flex-wrap: wrap; }
    @media (max-width: 560px) {
        .aos-row { grid-template-columns: minmax(0, 1fr) auto; padding: 14px 16px; }
        .aos-chev { display: none; }
        .aos-phone { display: none; }
        .aos-pager { gap: 10px; }
    }
`;
