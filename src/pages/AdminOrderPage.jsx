import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderByToken, confirmOrder } from '../services/orderService';
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

const styles = {
  page: {
    minHeight: '100vh',
    background: T.BG,
    color: T.TEXT,
    fontFamily: T.SANS,
  },
  header: {
    borderBottom: `1px solid ${T.BORDER}`,
    padding: '18px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    background: 'rgba(8,8,8,0.95)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    border: `1px solid ${T.BORDER}`,
    color: T.GOLD_L,
    fontFamily: T.SANS,
    fontSize: 13,
    padding: '7px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    letterSpacing: '0.04em',
    transition: 'border-color 0.2s',
  },
  headerTitle: {
    fontFamily: T.SERIF,
    fontSize: 20,
    color: T.GOLD,
    letterSpacing: '0.12em',
    fontWeight: 400,
    flex: 1,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    color: T.MUTED,
    letterSpacing: '0.06em',
    minWidth: 120,
    textAlign: 'right',
  },
  body: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '40px 24px 80px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  },
  spinner: {
    width: 36,
    height: 36,
    border: `3px solid ${T.BORDER}`,
    borderTop: `3px solid ${T.GOLD}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerText: {
    color: T.MUTED,
    fontSize: 14,
    letterSpacing: '0.06em',
  },
  errorTitle: {
    fontFamily: T.SERIF,
    fontSize: 28,
    color: T.GOLD,
    marginBottom: 8,
  },
  errorSub: {
    color: T.MUTED,
    fontSize: 14,
  },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(218,165,32,0.12)',
    border: '1px solid rgba(218,165,32,0.35)',
    color: '#f0c844',
    fontSize: 11,
    fontFamily: T.SANS,
    letterSpacing: '0.14em',
    fontWeight: 600,
    padding: '6px 16px',
    borderRadius: 4,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  badgeConfirmed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(34,197,94,0.10)',
    border: '1px solid rgba(34,197,94,0.30)',
    color: '#4ade80',
    fontSize: 11,
    fontFamily: T.SANS,
    letterSpacing: '0.14em',
    fontWeight: 600,
    padding: '6px 16px',
    borderRadius: 4,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  confirmedAt: {
    fontSize: 12,
    color: T.MUTED,
    marginTop: -20,
    marginBottom: 28,
    letterSpacing: '0.04em',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${T.BORDER}`,
    borderRadius: 10,
    padding: '24px 28px',
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: '0.18em',
    color: T.MUTED,
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: 18,
    fontFamily: T.SANS,
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  itemImg: {
    width: 60,
    height: 60,
    objectFit: 'cover',
    borderRadius: 6,
    border: `1px solid ${T.BORDER}`,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.04)',
  },
  itemImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    border: `1px solid ${T.BORDER}`,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: T.MUTED,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: T.SERIF,
    fontSize: 17,
    color: T.GOLD_L,
    fontWeight: 400,
    marginBottom: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    fontSize: 12,
    color: T.MUTED,
    letterSpacing: '0.03em',
  },
  itemSubtotal: {
    fontFamily: T.SERIF,
    fontSize: 16,
    color: T.TEXT,
    flexShrink: 0,
    textAlign: 'right',
  },
  divider: {
    borderTop: `1px solid ${T.BORDER}`,
    margin: '16px 0',
  },
  savings: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#4ade80',
    marginBottom: 8,
    letterSpacing: '0.03em',
  },
  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grandTotalLabel: {
    fontFamily: T.SERIF,
    fontSize: 18,
    color: T.TEXT,
    letterSpacing: '0.06em',
  },
  grandTotalValue: {
    fontFamily: T.SERIF,
    fontSize: 26,
    color: T.GOLD,
    letterSpacing: '0.04em',
  },
  deliveryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: T.TEXT,
    marginBottom: 10,
    gap: 12,
  },
  deliveryLabel: {
    color: T.MUTED,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 500,
    flexShrink: 0,
    paddingTop: 1,
  },
  deliveryValue: {
    textAlign: 'right',
    flex: 1,
    color: T.TEXT,
    fontSize: 14,
  },
  confirmBtn: {
    width: '100%',
    padding: '16px 0',
    background: `linear-gradient(135deg, ${T.GOLD_D} 0%, ${T.GOLD} 50%, ${T.GOLD_L} 100%)`,
    border: 'none',
    borderRadius: 8,
    color: '#080808',
    fontFamily: T.SANS,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    marginTop: 8,
    textTransform: 'uppercase',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  btnNote: {
    fontSize: 11,
    color: T.MUTED,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: '0.04em',
  },
  successBox: {
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: 8,
    padding: '18px 24px',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    color: '#4ade80',
    letterSpacing: '0.03em',
  },
};

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminOrderPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderByToken(token)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const status = err?.response?.status;
          if (status === 404) {
            setNotFound(true);
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      const updated = await confirmOrder(token);
      setOrder(updated);
      setJustConfirmed(true);
    } catch (err) {
      console.error('Failed to confirm order:', err);
      alert('Failed to confirm order. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmed = order?.status === 'confirmed';

  const savings = order?.items
    ? order.items.reduce((acc, item) => {
        const orig = parseFloat(item.originalPrice || item.price || 0);
        const sale = parseFloat(item.price || 0);
        return acc + (orig - sale) * (item.quantity || 1);
      }, 0)
    : 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .confirm-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .back-btn:hover { border-color: ${T.GOLD_D} !important; }
      `}</style>

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <button
            className="back-btn"
            style={styles.backBtn}
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back
          </button>
          <span style={styles.headerTitle}>TRÉSOR BAGS — Order Confirmation</span>
          {user && (
            <span style={styles.headerSub}>
              {user.name || user.email || 'Admin'}
            </span>
          )}
        </header>

        <div style={styles.body}>
          {/* Loading */}
          {loading && (
            <div style={styles.center}>
              <div style={styles.spinner} />
              <span style={styles.spinnerText}>Loading order…</span>
            </div>
          )}

          {/* Not found */}
          {!loading && notFound && (
            <div style={styles.center}>
              <div style={styles.errorTitle}>Order Not Found</div>
              <div style={styles.errorSub}>
                No order exists for this token.
              </div>
            </div>
          )}

          {/* Order loaded */}
          {!loading && !notFound && order && (
            <>
              {/* Status badge */}
              {isConfirmed ? (
                <>
                  <div style={styles.badgeConfirmed}>
                    <span>✓</span> Payment Confirmed
                  </div>
                  {order.confirmedAt && (
                    <div style={styles.confirmedAt}>
                      Confirmed on{' '}
                      {new Date(order.confirmedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.badgePending}>
                  <span>⏳</span> Awaiting Confirmation
                </div>
              )}

              {/* Order Summary */}
              <div style={styles.card}>
                <div style={styles.cardLabel}>Order Summary</div>

                {(order.items || []).map((item, i) => (
                  <div key={item._id || i} style={styles.itemRow}>
                    {item.image ? (
                      <img src={item.image} alt={item.title} style={styles.itemImg} />
                    ) : (
                      <div style={styles.itemImgPlaceholder}>🛍</div>
                    )}
                    <div style={styles.itemInfo}>
                      <div style={styles.itemTitle}>{item.title || item.name}</div>
                      <div style={styles.itemMeta}>
                        ${fmt(item.price)} × {item.quantity || 1}
                      </div>
                    </div>
                    <div style={styles.itemSubtotal}>
                      ${fmt(parseFloat(item.price) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}

                <div style={styles.divider} />

                {savings > 0 && (
                  <div style={styles.savings}>
                    <span>Total Savings</span>
                    <span>−${fmt(savings)}</span>
                  </div>
                )}

                <div style={styles.grandTotal}>
                  <span style={styles.grandTotalLabel}>Grand Total</span>
                  <span style={styles.grandTotalValue}>${fmt(order.total || order.grandTotal || 0)}</span>
                </div>
              </div>

              {/* Delivering To */}
              <div style={styles.card}>
                <div style={styles.cardLabel}>Delivering To</div>

                <div style={styles.deliveryRow}>
                  <span style={styles.deliveryLabel}>Name</span>
                  <span style={styles.deliveryValue}>
                    {[order.shipping?.firstName, order.shipping?.lastName]
                      .filter(Boolean)
                      .join(' ') ||
                      order.shipping?.name ||
                      '—'}
                  </span>
                </div>

                {(order.shipping?.phone || order.shipping?.phoneNumber) && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>Phone</span>
                    <span style={styles.deliveryValue}>
                      {order.shipping?.phonePrefix || order.shipping?.prefix
                        ? `${order.shipping.phonePrefix || order.shipping.prefix} `
                        : ''}
                      {order.shipping?.phone || order.shipping?.phoneNumber}
                    </span>
                  </div>
                )}

                {order.shipping?.email && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>Email</span>
                    <span style={styles.deliveryValue}>{order.shipping.email}</span>
                  </div>
                )}

                {order.shipping?.address && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>Address</span>
                    <span style={styles.deliveryValue}>{order.shipping.address}</span>
                  </div>
                )}

                {(order.shipping?.locality || order.shipping?.city) && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>Locality</span>
                    <span style={styles.deliveryValue}>
                      {order.shipping?.locality || order.shipping?.city}
                    </span>
                  </div>
                )}

                {order.shipping?.district && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>District</span>
                    <span style={styles.deliveryValue}>{order.shipping.district}</span>
                  </div>
                )}

                {order.shipping?.region && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>Region</span>
                    <span style={styles.deliveryValue}>{order.shipping.region}</span>
                  </div>
                )}

                {order.shipping?.moreInfo && (
                  <div style={styles.deliveryRow}>
                    <span style={styles.deliveryLabel}>More Info</span>
                    <span style={styles.deliveryValue}>{order.shipping.moreInfo}</span>
                  </div>
                )}
              </div>

              {/* Action area */}
              {!isConfirmed && !justConfirmed && (
                <>
                  <button
                    className="confirm-btn"
                    style={{
                      ...styles.confirmBtn,
                      ...(confirming ? styles.confirmBtnDisabled : {}),
                    }}
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirming…' : 'Confirm Payment Received ✓'}
                  </button>
                  <div style={styles.btnNote}>
                    This will deduct stock for each item automatically.
                  </div>
                </>
              )}

              {(isConfirmed || justConfirmed) && (
                <div style={styles.successBox}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span>Payment confirmed. Stock has been updated.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
