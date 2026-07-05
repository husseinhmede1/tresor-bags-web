import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderByToken, confirmOrder, cancelOrder } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

const T = {
  BG: '#080808',
  GOLD: '#dfa94b',
  GOLD_L: '#E5C48A',
  GOLD_D: '#C9A86A',
  MUTED: '#6B6560',
  TEXT: '#F5F1E8',
  BORDER: 'rgba(201,168,106,0.15)',
  SERIF: "'Cormorant Garamond', serif",
  SANS: "'Inter', sans-serif",
};

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
    `✅ Your Trésor Bags order has been confirmed!`,
    ``,
    `Hi ${d.name || ''} ${d.surname || ''}`.trim() + `,`,
    `We've received your payment and your order is being prepared.`,
    ``,
    `🛍️ Items ordered:`,
  ];
  (order.items || []).forEach(item => {
    lines.push(`• ${item.title} ×${item.quantity} — $${fmt(item.subtotal)}`);
  });
  lines.push(``);
  lines.push(`💳 Total Paid: $${fmt(order.total)}`);
  lines.push(``);
  lines.push(`📦 Delivering to: ${d.address || ''}, ${d.locality || ''}, ${d.district || ''}, ${d.region || ''}`);
  lines.push(``);
  lines.push(`We'll contact you soon to arrange delivery. Thank you for shopping with Trésor Bags! 🙏`);
  return lines.join('\n');
}

function buildCancelMessage(order) {
  const d = order.delivery || {};
  const lines = [
    `❌ Your Trésor Bags order has been cancelled.`,
    ``,
    `Hi ${d.name || ''} ${d.surname || ''}`.trim() + `,`,
    `Unfortunately your order has been cancelled. This may be due to stock unavailability or payment issues.`,
    ``,
    `Please contact us for more information or to place a new order.`,
    ``,
    `Thank you for your understanding. — Trésor Bags`,
  ];
  return lines.join('\n');
}

export default function AdminOrderPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    try {
      const updated = await confirmOrder(token);
      setOrder(updated);
      // WhatsApp to customer
      const phone = customerPhone(order?.delivery);
      if (phone) {
        const msg = buildConfirmMessage(order);
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
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
    try {
      const updated = await cancelOrder(token);
      setOrder(updated);
      // WhatsApp to customer
      const phone = customerPhone(order?.delivery);
      if (phone) {
        const msg = buildCancelMessage(order);
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      const data = err?.response?.data;
      alert(data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const isConfirmed = order?.status === 'confirmed';
  const isCancelled = order?.status === 'cancelled';
  const savings = order?.savings || 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-confirm-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .admin-cancel-btn:hover:not(:disabled) { opacity: 0.82; transform: translateY(-1px); }
        .admin-back-btn:hover { border-color: ${T.GOLD_D} !important; }
        .stock-popup-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }
        .stock-popup {
          background: #0e0e0e; border: 1px solid rgba(239,68,68,0.35);
          border-radius: 12px; padding: 32px; max-width: 480px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Stock error popup */}
      {stockError && (
        <div className="stock-popup-overlay" onClick={() => setStockError(null)}>
          <div className="stock-popup" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <h2 style={{ fontFamily: T.SERIF, fontSize: 22, color: '#f87171', fontWeight: 400, margin: '0 0 8px' }}>
              Insufficient Stock
            </h2>
            <p style={{ color: T.MUTED, fontSize: 13, marginBottom: 20 }}>
              The following items don't have enough stock to fulfil this order. No changes were made.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {stockError.insufficient.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '12px 16px',
                }}>
                  <div style={{ fontFamily: T.SERIF, fontSize: 16, color: T.GOLD_L, marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.MUTED }}>
                    Required: <span style={{ color: '#f87171', fontWeight: 600 }}>{item.required}</span>
                    &nbsp;·&nbsp;
                    Available: <span style={{ color: '#4ade80', fontWeight: 600 }}>{item.available}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStockError(null)}
              style={{
                width: '100%', padding: '12px 0', background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.35)', borderRadius: 6,
                color: '#f87171', fontFamily: T.SANS, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: T.BG, color: T.TEXT, fontFamily: T.SANS }}>
        {/* Header */}
        <header style={{
          borderBottom: `1px solid ${T.BORDER}`, padding: '18px 32px',
          display: 'flex', alignItems: 'center', gap: 24,
          background: 'rgba(8,8,8,0.95)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            className="admin-back-btn"
            style={{
              background: 'none', border: `1px solid ${T.BORDER}`, color: T.GOLD_L,
              fontFamily: T.SANS, fontSize: 13, padding: '7px 16px', borderRadius: 6,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.04em', transition: 'border-color 0.2s',
            }}
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back
          </button>
          <span style={{
            fontFamily: T.SERIF, fontSize: 20, color: T.GOLD, letterSpacing: '0.12em',
            fontWeight: 400, flex: 1, textAlign: 'center',
          }}>
            TRÉSOR BAGS — Order Confirmation
          </span>
          {user && (
            <span style={{ fontSize: 12, color: T.MUTED, letterSpacing: '0.06em', minWidth: 120, textAlign: 'right' }}>
              {user.name || user.email || 'Admin'}
            </span>
          )}
        </header>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>
          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${T.BORDER}`, borderTop: `3px solid ${T.GOLD}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: T.MUTED, fontSize: 14, letterSpacing: '0.06em' }}>Loading order…</span>
            </div>
          )}

          {/* Not found */}
          {!loading && notFound && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
              <div style={{ fontFamily: T.SERIF, fontSize: 28, color: T.GOLD }}>Order Not Found</div>
              <div style={{ color: T.MUTED, fontSize: 14 }}>No order exists for this token.</div>
            </div>
          )}

          {/* Order loaded */}
          {!loading && !notFound && order && (
            <>
              {/* Status badge */}
              {isConfirmed && (
                <>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.30)',
                    color: '#4ade80', fontSize: 11, fontFamily: T.SANS, letterSpacing: '0.14em',
                    fontWeight: 600, padding: '6px 16px', borderRadius: 4,
                    textTransform: 'uppercase', marginBottom: 28,
                  }}>
                    <span>✓</span> Payment Confirmed
                  </div>
                  {order.confirmedAt && (
                    <div style={{ fontSize: 12, color: T.MUTED, marginTop: -20, marginBottom: 28, letterSpacing: '0.04em' }}>
                      Confirmed on {new Date(order.confirmedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                </>
              )}

              {isCancelled && (
                <>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                    color: '#f87171', fontSize: 11, fontFamily: T.SANS, letterSpacing: '0.14em',
                    fontWeight: 600, padding: '6px 16px', borderRadius: 4,
                    textTransform: 'uppercase', marginBottom: 28,
                  }}>
                    <span>✕</span> Order Cancelled
                  </div>
                  {order.cancelledAt && (
                    <div style={{ fontSize: 12, color: T.MUTED, marginTop: -20, marginBottom: 28, letterSpacing: '0.04em' }}>
                      Cancelled on {new Date(order.cancelledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                </>
              )}

              {!isConfirmed && !isCancelled && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(218,165,32,0.12)', border: '1px solid rgba(218,165,32,0.35)',
                  color: '#f0c844', fontSize: 11, fontFamily: T.SANS, letterSpacing: '0.14em',
                  fontWeight: 600, padding: '6px 16px', borderRadius: 4,
                  textTransform: 'uppercase', marginBottom: 28,
                }}>
                  <span>⏳</span> Awaiting Confirmation
                </div>
              )}

              {/* Order Summary */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.BORDER}`,
                borderRadius: 10, padding: '24px 28px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', color: T.MUTED, textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
                  Order Summary
                </div>

                {(order.items || []).map((item, i) => (
                  <div key={item._id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    {item.mainImage ? (
                      <img src={item.mainImage} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: `1px solid ${T.BORDER}`, flexShrink: 0, background: 'rgba(255,255,255,0.04)' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: 6, border: `1px solid ${T.BORDER}`, flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: T.MUTED }}>🛍</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.SERIF, fontSize: 17, color: T.GOLD_L, fontWeight: 400, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, color: T.MUTED }}>
                        ${fmt(item.subtotal / (item.quantity || 1))} × {item.quantity || 1}
                      </div>
                    </div>
                    <div style={{ fontFamily: T.SERIF, fontSize: 16, color: T.TEXT, flexShrink: 0 }}>
                      ${fmt(item.subtotal)}
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: `1px solid ${T.BORDER}`, margin: '16px 0' }} />

                {savings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4ade80', marginBottom: 8 }}>
                    <span>Total Savings</span>
                    <span>−${fmt(savings)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: T.SERIF, fontSize: 18, color: T.TEXT }}>Grand Total</span>
                  <span style={{ fontFamily: T.SERIF, fontSize: 26, color: T.GOLD }}>${fmt(order.total || 0)}</span>
                </div>
              </div>

              {/* Delivering To */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.BORDER}`,
                borderRadius: 10, padding: '24px 28px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', color: T.MUTED, textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
                  Delivering To
                </div>

                {[
                  ['Name',     `${order.delivery?.name || ''} ${order.delivery?.surname || ''}`.trim()],
                  ['Phone',    `${order.delivery?.phonePrefix || ''} ${order.delivery?.phoneNumber || ''}`.trim()],
                  ['Email',    order.delivery?.email],
                  ['Address',  order.delivery?.address],
                  ['Locality', order.delivery?.locality],
                  ['District', order.delivery?.district],
                  ['Region',   order.delivery?.region],
                  ['Notes',    order.delivery?.moreInfo],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: T.TEXT, marginBottom: 10, gap: 12 }}>
                    <span style={{ color: T.MUTED, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, flexShrink: 0, paddingTop: 1 }}>{label}</span>
                    <span style={{ textAlign: 'right', flex: 1, color: T.TEXT, fontSize: 14 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Action area — only for pending orders */}
              {!isConfirmed && !isCancelled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    className="admin-confirm-btn"
                    style={{
                      width: '100%', padding: '16px 0',
                      background: confirming
                        ? 'rgba(223,169,75,0.4)'
                        : `linear-gradient(135deg, ${T.GOLD_D} 0%, ${T.GOLD} 50%, ${T.GOLD_L} 100%)`,
                      border: 'none', borderRadius: 8, color: '#080808',
                      fontFamily: T.SANS, fontSize: 15, fontWeight: 700,
                      letterSpacing: '0.08em', cursor: confirming ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase', transition: 'opacity 0.2s, transform 0.1s',
                      opacity: confirming ? 0.6 : 1,
                    }}
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirming…' : 'Confirm Payment Received ✓'}
                  </button>

                  <button
                    className="admin-cancel-btn"
                    style={{
                      width: '100%', padding: '14px 0',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      borderRadius: 8, color: '#f87171',
                      fontFamily: T.SANS, fontSize: 14, fontWeight: 600,
                      letterSpacing: '0.08em', cursor: cancelling ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase', transition: 'opacity 0.2s, transform 0.1s',
                      opacity: cancelling ? 0.6 : 1,
                    }}
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel Order ✕'}
                  </button>

                  <div style={{ fontSize: 11, color: T.MUTED, textAlign: 'center', letterSpacing: '0.04em' }}>
                    Confirming will deduct stock. Cancelling will notify the customer via WhatsApp.
                  </div>
                </div>
              )}

              {isConfirmed && (
                <div style={{
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 8, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontSize: 14, color: '#4ade80', letterSpacing: '0.03em',
                }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span>Payment confirmed. Stock has been updated.</span>
                </div>
              )}

              {isCancelled && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 8, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontSize: 14, color: '#f87171', letterSpacing: '0.03em',
                }}>
                  <span style={{ fontSize: 20 }}>❌</span>
                  <span>Order has been cancelled.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
