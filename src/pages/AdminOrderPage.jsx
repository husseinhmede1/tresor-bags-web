import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderByToken, confirmOrder, cancelOrder } from '../services/orderService';
import {
  ArrowLeft, ArrowSquareOut, CheckCircle, EnvelopeSimple, Handbag, MagnifyingGlass,
  MapPin, Note, Phone, User, WarningCircle, WhatsappLogo, XCircle,
} from '@phosphor-icons/react';
import { sized } from '../utils/image';
import AdminShell from '../components/storefront/AdminShell';

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function customerPhone(delivery) {
  if (!delivery) return null;
  const prefix = (delivery.phonePrefix || '').replace(/\D/g, '');
  const number = (delivery.phoneNumber || '').replace(/\D/g, '');
  return prefix + number || null;
}

function buildConfirmMessage(order) {
  const d = order.delivery || {};
  const lines = [
    `Your Tresor Bags order has been confirmed!`,
    ``,
    `Hi ${`${d.name || ''} ${d.surname || ''}`.trim()},`,
    `We've received your payment and your order is being prepared.`,
    ``,
    `Items ordered:`,
  ];
  (order.items || []).forEach(item => {
    lines.push(`- ${item.title} x${item.quantity} = $${fmt(item.subtotal)}`);
  });
  lines.push(``);
  lines.push(`Total Paid: $${fmt(order.total)}`);
  lines.push(``);
  const dest = [d.address, d.region].filter((s) => s && s.trim()).join(', ');
  if (dest) lines.push(`Delivering to: ${dest}`);
  lines.push(``);
  lines.push(`We will contact you soon to arrange delivery. Thank you for shopping with Tresor Bags!`);
  return lines.join('\n');
}

function buildCancelMessage(order) {
  const d = order.delivery || {};
  const lines = [
    `Your Tresor Bags order has been cancelled.`,
    ``,
    `Hi ${`${d.name || ''} ${d.surname || ''}`.trim()},`,
    `Unfortunately your order has been cancelled. This may be due to stock unavailability or payment issues.`,
    ``,
    `Please contact us for more information or to place a new order.`,
    ``,
    `Thank you for your understanding. - Tresor Bags`,
  ];
  return lines.join('\n');
}

export default function AdminOrderPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Stock error popup
  const [stockError, setStockError] = useState(null); // null | { insufficient: [...] }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderByToken(token)
      .then((data) => { if (!cancelled) { setOrder(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token]);

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setStockError(null);
    // Open the WhatsApp tab synchronously (within the click gesture) so it
    // isn't blocked as a pop-up after the await below.
    const phone = customerPhone(order?.delivery);
    const waWindow = phone ? window.open('', '_blank') : null;
    try {
      const updated = await confirmOrder(token);
      setOrder(updated);
      // WhatsApp to customer
      if (phone) {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildConfirmMessage(order))}`;
        if (waWindow && !waWindow.closed) waWindow.location.href = url;
        else window.location.href = url;
      }
    } catch (err) {
      if (waWindow && !waWindow.closed) waWindow.close();
      const data = err?.response?.data;
      if (data?.insufficient?.length) {
        setStockError({ insufficient: data.insufficient });
      } else {
        alert(data?.message || 'Failed to confirm order. Please try again.');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    // Open the WhatsApp tab synchronously (within the click gesture) so it
    // isn't blocked as a pop-up after the await below.
    const phone = customerPhone(order?.delivery);
    const waWindow = phone ? window.open('', '_blank') : null;
    try {
      const updated = await cancelOrder(token);
      setOrder(updated);
      // WhatsApp to customer
      if (phone) {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildCancelMessage(order))}`;
        if (waWindow && !waWindow.closed) waWindow.location.href = url;
        else window.location.href = url;
      }
    } catch (err) {
      if (waWindow && !waWindow.closed) waWindow.close();
      const data = err?.response?.data;
      alert(data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const isConfirmed = order?.status === 'confirmed';
  const isCancelled = order?.status === 'cancelled';
  const savings = order?.savings || 0;

  const d = order?.delivery || {};
  const customerName = `${d.name || ''} ${d.surname || ''}`.trim();
  const phoneDisplay = d.phoneNumber ? `${d.phonePrefix || ''} ${d.phoneNumber}`.trim() : '';
  const phoneDigits = customerPhone(d);
  const addressLine = [d.address, d.district, d.locality, d.region].filter((s) => s && String(s).trim()).join(', ');
  const mapHref = d.mapLink || (d.lat != null && d.lng != null ? `https://www.google.com/maps?q=${d.lat},${d.lng}` : null);
  const itemCount = (order?.items || []).reduce((n, it) => n + (it.quantity || 1), 0);
  const fmtWhen = (v) => new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <AdminShell width={1120}>
      <style>{ORDER_CSS}</style>

      {/* Stock error dialog */}
      {stockError && (
        <div className="aod-overlay" onClick={() => setStockError(null)}>
          <div className="sf-panel aod-dialog" role="alertdialog" aria-modal="true" aria-labelledby="aod-stock-title" onClick={e => e.stopPropagation()}>
            <WarningCircle size={32} color="var(--sf-danger)" />
            <h2 id="aod-stock-title" className="sf-h3" style={{ marginTop: 12 }}>Not enough stock</h2>
            <p className="sf-muted" style={{ fontSize: 14, marginTop: 6 }}>
              The following items don't have enough stock to fulfil this order. No changes were made.
            </p>
            <ul className="aod-stock">
              {stockError.insufficient.map((item, i) => (
                <li key={i}>
                  <p style={{ fontWeight: 550 }}>{item.title}</p>
                  <p className="sf-faint sf-num" style={{ fontSize: 13.5, marginTop: 2 }}>
                    Required <span className="aod-danger">{item.required}</span>
                    <span style={{ marginInline: 8 }}>·</span>
                    Available <span style={{ color: 'var(--sf-text)' }}>{item.available}</span>
                  </p>
                </li>
              ))}
            </ul>
            <button className="sf-btn sf-btn--ghost sf-btn--block" onClick={() => setStockError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => navigate('/admin/orders')}>
        <ArrowLeft size={16} /> Orders
      </button>

      {/* Loading */}
      {loading && (
        <div aria-busy="true" aria-label="Loading order" style={{ marginTop: 28 }}>
          <div className="sf-skel" style={{ height: 34, width: 260, maxWidth: '70%' }} />
          <div className="sf-skel" style={{ height: 20, width: 200, marginTop: 12 }} />
          <div className="aod-grid">
            <div className="sf-skel" style={{ height: 320, borderRadius: 20 }} />
            <div className="sf-skel" style={{ height: 320, borderRadius: 20 }} />
          </div>
        </div>
      )}

      {/* Not found */}
      {!loading && notFound && (
        <div className="sf-panel aod-empty">
          <MagnifyingGlass size={40} color="#8C867E" />
          <h1 className="sf-h3">Order not found</h1>
          <p className="sf-muted">No order exists for this token.</p>
        </div>
      )}

      {/* Order loaded */}
      {!loading && !notFound && order && (
        <>
          <div className="aod-head">
            <h1 className="sf-h2">{customerName || 'Order'}</h1>
            <div className="aod-meta">
              {isConfirmed && <span className="sf-status sf-status--confirmed">Confirmed</span>}
              {isCancelled && <span className="sf-status sf-status--cancelled">Cancelled</span>}
              {!isConfirmed && !isCancelled && <span className="sf-status sf-status--pending">Awaiting confirmation</span>}
              {order.createdAt && <span className="sf-faint sf-num">Placed {fmtWhen(order.createdAt)}</span>}
            </div>
          </div>

          <div className="aod-grid">
            {/* Items and totals */}
            <section className="sf-panel">
              <div className="aod-panel-head">
                <h2 className="sf-h3">Items</h2>
                <span className="sf-faint sf-num" style={{ fontSize: 14 }}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              </div>

              <ul className="aod-items">
                {(order.items || []).map((item, i) => (
                  <li key={item._id || i} className="aod-item">
                    <span className="sf-tile aod-thumb">
                      {item.mainImage
                        ? <img src={sized(item.mainImage, 160)} alt={item.title} />
                        : <Handbag size={22} color="#8C867E" />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p className="aod-item__title">{item.title}</p>
                      <p className="sf-faint sf-num" style={{ fontSize: 13.5, marginTop: 2 }}>
                        ${fmt(item.subtotal / (item.quantity || 1))} × {item.quantity || 1}
                      </p>
                    </div>
                    <span className="sf-num" style={{ fontWeight: 600 }}>${fmt(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="aod-totals">
                {savings > 0 && (
                  <div>
                    <span className="sf-muted">Savings</span>
                    <span className="sf-num sf-gold">−${fmt(savings)}</span>
                  </div>
                )}
                <div className="aod-total">
                  <span>Total</span>
                  <span className="sf-num">${fmt(order.total || 0)}</span>
                </div>
              </div>
            </section>

            {/* Customer, delivery and actions */}
            <div className="aod-side">
              <section className="sf-panel">
                <h2 className="sf-h3">Customer and delivery</h2>
                <dl className="aod-info">
                  <div>
                    <dt><User size={18} /></dt>
                    <dd>{customerName || <span className="sf-faint">Name not given</span>}</dd>
                  </div>
                  {phoneDisplay && (
                    <div>
                      <dt><Phone size={18} /></dt>
                      <dd className="aod-phone">
                        <a href={`tel:${phoneDigits ? '+' + phoneDigits : phoneDisplay}`} className="sf-num">{phoneDisplay}</a>
                        {phoneDigits && (
                          <a className="sf-btn sf-btn--ghost sf-btn--sm" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">
                            <WhatsappLogo size={16} /> WhatsApp
                          </a>
                        )}
                      </dd>
                    </div>
                  )}
                  {d.email && (
                    <div>
                      <dt><EnvelopeSimple size={18} /></dt>
                      <dd><a href={`mailto:${d.email}`}>{d.email}</a></dd>
                    </div>
                  )}
                  <div>
                    <dt><MapPin size={18} /></dt>
                    <dd>
                      {addressLine || <span className="sf-faint">Address not given</span>}
                      {mapHref && (
                        <a className="aod-map" href={mapHref} target="_blank" rel="noreferrer">
                          Open in Google Maps <ArrowSquareOut size={14} />
                        </a>
                      )}
                    </dd>
                  </div>
                  {d.moreInfo && (
                    <div>
                      <dt><Note size={18} /></dt>
                      <dd className="sf-muted" style={{ whiteSpace: 'pre-line' }}>{d.moreInfo}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Actions: only for pending orders */}
              {!isConfirmed && !isCancelled && (
                <section className="sf-panel aod-actions">
                  <button
                    className="sf-btn sf-btn--primary sf-btn--block"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    <CheckCircle size={18} weight="bold" />
                    {confirming ? 'Confirming…' : 'Confirm payment'}
                  </button>
                  <button
                    className="sf-btn sf-btn--ghost sf-btn--block aod-cancel"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    <XCircle size={18} />
                    {cancelling ? 'Cancelling…' : 'Cancel order'}
                  </button>
                  <p className="sf-faint" style={{ fontSize: 13, textAlign: 'center' }}>
                    Confirming deducts stock. Both actions open WhatsApp with a message for the customer.
                  </p>
                </section>
              )}

              {isConfirmed && (
                <div className="aod-state aod-state--ok">
                  <CheckCircle size={22} weight="fill" />
                  <div>
                    <p>Payment confirmed. Stock has been updated.</p>
                    {order.confirmedAt && <p className="aod-state__when sf-num">Confirmed on {fmtWhen(order.confirmedAt)}</p>}
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="aod-state aod-state--bad">
                  <XCircle size={22} weight="fill" />
                  <div>
                    <p>Order has been cancelled.</p>
                    {order.cancelledAt && <p className="aod-state__when sf-num">Cancelled on {fmtWhen(order.cancelledAt)}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

const ORDER_CSS = `
  .aod-head { display: grid; gap: 12px; margin-top: 24px; }
  .aod-head h1 { overflow-wrap: anywhere; }
  .aod-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; font-size: 14px; }
  .aod-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 20px; margin-top: 28px; align-items: start; }
  .aod-side { display: grid; gap: 20px; }
  .aod-panel-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .aod-items { list-style: none; margin: 16px 0 0; padding: 0; display: grid; }
  .aod-item { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding-block: 14px; }
  .aod-item + .aod-item { border-top: 1px solid var(--sf-line); }
  .aod-thumb { width: 64px; aspect-ratio: 1; border-radius: 12px; cursor: default; display: grid; place-items: center; }
  .aod-thumb img { padding: 8%; }
  .aod-item__title { font-weight: 550; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .aod-totals { display: grid; gap: 10px; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--sf-line); font-size: 15px; }
  .aod-totals > div { display: flex; justify-content: space-between; gap: 12px; }
  .aod-total { align-items: baseline; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  .aod-info { margin: 16px 0 0; display: grid; gap: 14px; font-size: 15px; }
  .aod-info > div { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 12px; align-items: start; }
  .aod-info dt { color: var(--sf-text-3); padding-top: 2px; }
  .aod-info dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  .aod-info a { color: var(--sf-text); text-decoration-color: var(--sf-line-2); text-underline-offset: 3px; }
  .aod-phone { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
  .aod-phone .sf-btn { text-decoration: none; }
  .aod-map { display: inline-flex !important; align-items: center; gap: 6px; margin-top: 8px; color: var(--sf-gold) !important; font-size: 14px; font-weight: 500; }
  .aod-actions { display: grid; gap: 10px; }
  .aod-cancel { color: var(--sf-danger); }
  .aod-cancel:hover:not(:disabled) { border-color: rgba(240, 144, 127, 0.5) !important; background: rgba(240, 144, 127, 0.06) !important; }
  .aod-state { display: flex; gap: 12px; align-items: flex-start; padding: 18px 20px; border-radius: 16px; border: 1px solid; font-size: 15px; }
  .aod-state--ok { color: #8FCB98; background: rgba(143, 203, 152, 0.08); border-color: rgba(143, 203, 152, 0.25); }
  .aod-state--bad { color: var(--sf-danger); background: rgba(240, 144, 127, 0.08); border-color: rgba(240, 144, 127, 0.25); }
  .aod-state svg { flex-shrink: 0; margin-top: 1px; }
  .aod-state__when { color: var(--sf-text-3); font-size: 13.5px; margin-top: 2px; }
  .aod-empty { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 56px 24px; margin-top: 24px; }
  .aod-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.72); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .aod-dialog { max-width: 460px; width: 100%; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); }
  .aod-stock { list-style: none; margin: 18px 0 22px; padding: 0; display: grid; gap: 8px; }
  .aod-stock li { padding: 12px 14px; border-radius: 12px; background: var(--sf-surface-2); border: 1px solid var(--sf-line); }
  .aod-danger { color: var(--sf-danger); font-weight: 600; }
  @media (max-width: 860px) {
    .aod-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .aod-item { grid-template-columns: 52px minmax(0, 1fr) auto; gap: 12px; }
    .aod-thumb { width: 52px; }
  }
`;
