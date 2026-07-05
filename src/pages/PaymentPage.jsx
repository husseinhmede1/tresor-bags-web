import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const C = {
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

function fmt(n) {
  return '$' + Number(n).toFixed(2);
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, clearCart, totalPrice, totalSavings } = useCart();
  const [delivery, setDelivery] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('tresor-delivery');
    if (!raw) { navigate('/'); return; }
    try {
      const parsed = JSON.parse(raw);
      setDelivery(parsed);
    } catch {
      navigate('/');
    }
  }, []);

  const cartItems = Object.values(items).filter(({ quantity }) => quantity > 0);

  useEffect(() => {
    if (delivery && cartItems.length === 0 && !success) {
      navigate('/');
    }
  }, [delivery, cartItems.length, success]);

  if (!delivery) return null;

  function buildMessage() {
    const lines = [];
    lines.push('🛍️ NEW ORDER - Trésor Bags');
    lines.push('');
    lines.push(`👤 Customer: ${delivery.name} ${delivery.surname}`);
    lines.push(`📞 Phone: ${delivery.phonePrefix}${delivery.phoneNumber}`);
    lines.push(`📧 Email: ${delivery.email}`);
    lines.push(`📍 Address: ${delivery.address}, ${delivery.locality}, ${delivery.district}, ${delivery.region}`);
    lines.push(`ℹ️ Notes: ${delivery.moreInfo?.trim() || 'None'}`);
    lines.push('');
    lines.push('🛒 Items:');
    cartItems.forEach(({ bag, quantity }) => {
      const discount = bag.categoryId?.discount ?? 0;
      const unit = bag.price * (1 - discount / 100);
      const subtotal = unit * quantity;
      lines.push(`• ${bag.title || bag.name} x${quantity} — ${fmt(subtotal)}`);
    });
    lines.push('');
    if (totalSavings > 0) {
      lines.push(`💰 Total Savings: ${fmt(totalSavings)}`);
    }
    lines.push(`💳 Grand Total: ${fmt(totalPrice)}`);
    lines.push('');
    lines.push('💳 Payment: Whish Transfer to +961 78987288');
    return lines.join('\n');
  }

  function handleConfirm() {
    if (confirming) return;
    setConfirming(true);

    const msg = buildMessage();
    const encoded = encodeURIComponent(msg);

    window.open(`https://wa.me/96178987288?text=${encoded}`, '_blank');

    setTimeout(() => {
      window.open(`https://wa.me/96178985529?text=${encoded}`, '_blank');
    }, 1000);

    setTimeout(() => {
      clearCart();
      sessionStorage.removeItem('tresor-delivery');
      setSuccess(true);
    }, 500);

    setTimeout(() => {
      navigate('/');
    }, 1500);
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: C.BG, color: C.TEXT, fontFamily: C.SANS,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 32,
      }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <h2 style={{ fontFamily: C.SERIF, fontSize: 28, color: C.GOLD_L, fontWeight: 400, margin: 0 }}>
          Order Confirmed!
        </h2>
        <p style={{ color: C.MUTED, textAlign: 'center', maxWidth: 360 }}>
          Your order has been sent via WhatsApp. We'll be in touch shortly to confirm delivery.
        </p>
        <p style={{ color: C.MUTED, fontSize: 13 }}>Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT, fontFamily: C.SANS }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
        borderBottom: `1px solid ${C.BORDER}`, position: 'sticky', top: 0,
        background: C.BG, zIndex: 10,
      }}>
        <button onClick={() => navigate('/checkout/delivery')} style={backBtn} aria-label="Back">←</button>
        <span style={{ fontFamily: C.SERIF, fontSize: 22, letterSpacing: '0.15em', color: C.GOLD, fontWeight: 600 }}>
          TRÉSOR BAGS
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 100px' }}>
        <h1 style={{ fontFamily: C.SERIF, fontSize: 32, fontWeight: 400, color: C.GOLD_L, marginBottom: 4 }}>
          Complete Your Order
        </h1>
        <p style={{ color: C.MUTED, fontSize: 14, marginBottom: 36 }}>
          Step 2 of 2 — Review and pay
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Order Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.BORDER}`,
            borderRadius: 8, padding: 24,
          }}>
            <h2 style={{ fontFamily: C.SERIF, fontSize: 20, color: C.GOLD, fontWeight: 500, margin: '0 0 20px' }}>
              Order Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cartItems.map(({ bag, quantity }) => {
                const discount = bag.categoryId?.discount ?? 0;
                const unit = bag.price * (1 - discount / 100);
                const subtotal = unit * quantity;
                return (
                  <div key={bag.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={bag.imageUrl || bag.image || ''}
                      alt={bag.title || bag.name}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 3, flexShrink: 0, background: '#111' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: C.SERIF, fontSize: 15, color: C.GOLD_L, margin: '0 0 2px', fontWeight: 500 }}>
                        {bag.title || bag.name}
                      </p>
                      <p style={{ fontSize: 12, color: C.MUTED, margin: 0 }}>
                        {fmt(unit)} × {quantity}
                      </p>
                    </div>
                    <span style={{ fontSize: 15, color: C.TEXT, flexShrink: 0 }}>{fmt(subtotal)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ height: 1, background: C.BORDER, margin: '20px 0' }} />

            {totalSavings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#5dba6e', fontSize: 14 }}>Total Savings</span>
                <span style={{ color: '#5dba6e', fontSize: 14, fontWeight: 600 }}>{fmt(totalSavings)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: C.SERIF, fontSize: 18, color: C.TEXT }}>Grand Total</span>
              <span style={{ fontFamily: C.SERIF, fontSize: 24, color: C.GOLD, fontWeight: 600 }}>
                {fmt(totalPrice)}
              </span>
            </div>

            {/* Delivery summary */}
            <div style={{ marginTop: 20, padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.MUTED, marginBottom: 8 }}>
                Delivering to
              </p>
              <p style={{ fontSize: 13, color: C.TEXT, margin: '0 0 2px' }}>
                {delivery.name} {delivery.surname}
              </p>
              <p style={{ fontSize: 13, color: C.MUTED, margin: '0 0 2px' }}>
                {delivery.address}
              </p>
              <p style={{ fontSize: 13, color: C.MUTED, margin: 0 }}>
                {delivery.locality}, {delivery.district}, {delivery.region}
              </p>
            </div>
          </div>

          {/* Payment Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.BORDER}`,
              borderRadius: 8, padding: 24,
            }}>
              <h2 style={{ fontFamily: C.SERIF, fontSize: 20, color: C.GOLD, fontWeight: 500, margin: '0 0 20px' }}>
                Payment Instructions
              </h2>

              {/* Whish block */}
              <div style={{
                background: 'rgba(230,0,60,0.08)', border: '1px solid rgba(230,0,60,0.2)',
                borderRadius: 8, padding: '20px', marginBottom: 20,
              }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #e6003c, #ff4d7a)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  padding: '6px 18px',
                  borderRadius: 6,
                  marginBottom: 16,
                }}>
                  WHISH
                </div>

                <p style={{ fontSize: 14, color: C.MUTED, margin: '0 0 12px' }}>
                  Send {fmt(totalPrice)} to Whish number:
                </p>

                <p style={{
                  fontFamily: C.SERIF, fontSize: 28, color: C.GOLD, fontWeight: 600,
                  margin: '0 0 12px', letterSpacing: '0.05em',
                }}>
                  +961 78 987 288
                </p>

                <p style={{ fontSize: 13, color: C.TEXT, margin: '0 0 8px' }}>
                  Once transferred, click <strong>'Confirm Order'</strong> below
                </p>

                <p style={{ fontSize: 12, color: C.MUTED, margin: 0, fontStyle: 'italic' }}>
                  Keep your transfer receipt for reference
                </p>
              </div>

              <div style={{
                background: 'rgba(223,169,75,0.06)', border: `1px solid ${C.BORDER}`,
                borderRadius: 6, padding: 14, marginBottom: 4,
              }}>
                <p style={{ fontSize: 13, color: C.MUTED, margin: 0 }}>
                  After confirming, your order details will be sent automatically to our team via WhatsApp and we'll contact you to arrange delivery.
                </p>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                background: confirming
                  ? 'rgba(223,169,75,0.4)'
                  : 'linear-gradient(135deg, #dfa94b, #C9A86A)',
                color: '#080808',
                border: 'none',
                borderRadius: 4,
                padding: '16px 32px',
                fontSize: 15,
                fontFamily: C.SANS,
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: confirming ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                width: '100%',
                transition: 'background 0.3s',
              }}
            >
              {confirming ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const backBtn = {
  background: 'none',
  border: 'none',
  color: '#dfa94b',
  cursor: 'pointer',
  fontSize: 22,
  lineHeight: 1,
  padding: 4,
};
