import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChartBar, Handbag } from "@phosphor-icons/react";
import { getStats } from "../services/orderService";
import { sized } from "../utils/image";
import AdminShell from "../components/storefront/AdminShell";

const PERIODS = [{ k: "day", label: "Day" }, { k: "week", label: "Week" }, { k: "month", label: "Month" }];

const money = (n) => "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminStatsPage() {
    const navigate = useNavigate();
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
        { label: "Revenue", value: money(k.revenue), hint: "From confirmed sales" },
        { label: "Confirmed orders", value: k.confirmedOrders ?? 0 },
        { label: "Average order value", value: money(k.avgOrderValue) },
        { label: "Discounts given", value: money(k.discountsGiven) },
        { label: "Pending", value: k.pendingOrders ?? 0, hint: "Needs action", action: () => navigate("/admin/orders?status=pending") },
        { label: "Cancelled", value: k.cancelledOrders ?? 0 },
    ];

    const periodSwitch = (
        <div className="sf-seg" role="group" aria-label="Period">
            {PERIODS.map((p) => (
                <button key={p.k} type="button" aria-pressed={period === p.k} onClick={() => setPeriod(p.k)}>{p.label}</button>
            ))}
        </div>
    );

    return (
        <AdminShell title="Statistics" subtitle="Sales from confirmed orders" actions={periodSwitch} width={1120}>
            <style>{STATS_CSS}</style>

            {error && <p className="sf-error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

            {loading ? (
                <div aria-busy="true" aria-label="Loading statistics">
                    <div className="ast-kpis">
                        {kpiCards.map((c) => (
                            <div key={c.label} className="sf-stat">
                                <div className="sf-skel" style={{ height: 14, width: "55%" }} />
                                <div className="sf-skel" style={{ height: 30, width: "70%", marginTop: 4 }} />
                            </div>
                        ))}
                    </div>
                    <div className="sf-panel" style={{ marginTop: 20 }}>
                        <div className="sf-skel" style={{ height: 200 }} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="ast-kpis">
                        {kpiCards.map((c) => {
                            const body = (
                                <>
                                    <span className="sf-stat__label">{c.label}</span>
                                    <span className="sf-stat__value">{c.value}</span>
                                    {c.hint && (
                                        <span className={c.action ? "ast-hint ast-hint--gold" : "ast-hint"}>
                                            {c.hint}{c.action && <ArrowRight size={13} weight="bold" />}
                                        </span>
                                    )}
                                </>
                            );
                            return c.action ? (
                                <button key={c.label} type="button" className="sf-stat ast-stat--btn" onClick={c.action}>{body}</button>
                            ) : (
                                <div key={c.label} className="sf-stat">{body}</div>
                            );
                        })}
                    </div>

                    <div className="ast-cols">
                        <section className="sf-panel">
                            <h2 className="sf-h3">Revenue</h2>
                            {series.length === 0 ? (
                                <div className="ast-empty">
                                    <ChartBar size={32} color="#8C867E" />
                                    <p className="sf-muted">No confirmed sales in this period.</p>
                                </div>
                            ) : (
                                <div className="ast-chart" role="img" aria-label="Revenue per period">
                                    {series.map((s) => (
                                        <div key={s.bucket} className="ast-bar" title={`${s.bucket} · ${money(s.revenue)} · ${s.orders} orders`}>
                                            <div className="ast-bar__fill" style={{ height: `${Math.round((s.revenue / maxRev) * 150)}px` }} />
                                            <span className="ast-bar__label sf-num">{s.bucket.slice(5)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="sf-panel">
                            <h2 className="sf-h3">Best sellers</h2>
                            {(stats?.topSellers || []).length === 0 ? (
                                <div className="ast-empty">
                                    <Handbag size={32} color="#8C867E" />
                                    <p className="sf-muted">No sales yet.</p>
                                </div>
                            ) : (
                                <ol className="ast-sellers">
                                    {stats.topSellers.map((b, i) => (
                                        <li key={b.title + i} className="ast-seller">
                                            {b.mainImage ? (
                                                <span className="sf-tile ast-thumb"><img src={sized(b.mainImage, 120)} alt="" /></span>
                                            ) : (
                                                <span className="ast-rank sf-num">{i + 1}</span>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <p className="ast-seller__title">{b.title}</p>
                                                <p className="sf-faint sf-num" style={{ fontSize: 13.5 }}>{b.quantity} sold</p>
                                            </div>
                                            <span className="sf-num" style={{ fontWeight: 600 }}>{money(b.revenue)}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>
                </>
            )}
        </AdminShell>
    );
}

const STATS_CSS = `
    .ast-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .ast-stat--btn { font: inherit; color: inherit; text-align: left; cursor: pointer; transition: border-color .2s, background-color .2s; }
    .ast-stat--btn:hover { border-color: rgba(217, 178, 111, 0.4); background: #17171a; }
    .ast-kpis .sf-stat { align-content: start; }
    .ast-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--sf-text-3); }
    .ast-hint--gold { color: var(--sf-gold); }
    .ast-cols { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; margin-top: 20px; align-items: start; }
    .ast-empty { display: grid; justify-items: center; gap: 10px; text-align: center; padding: 40px 12px 24px; }
    .ast-chart { display: flex; align-items: flex-end; gap: 4px; height: 190px; margin-top: 20px; }
    .ast-bar { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .ast-bar__fill { width: 100%; max-width: 34px; min-height: 2px; background: var(--sf-gold); border-radius: 6px 6px 2px 2px; }
    .ast-bar__label { font-size: 11px; color: var(--sf-text-3); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: clip; }
    .ast-sellers { list-style: none; margin: 16px 0 0; padding: 0; display: grid; }
    .ast-seller { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding-block: 12px; }
    .ast-seller + .ast-seller { border-top: 1px solid var(--sf-line); }
    .ast-thumb { width: 48px; aspect-ratio: 1; border-radius: 12px; cursor: default; }
    .ast-thumb img { padding: 8%; }
    .ast-rank { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background: var(--sf-surface-2); color: var(--sf-text-2); font-weight: 600; font-size: 15px; }
    .ast-seller__title { font-weight: 550; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 900px) {
        .ast-cols { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
        .ast-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ast-kpis .sf-stat { padding: 16px; }
    }
`;
