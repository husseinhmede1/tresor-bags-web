import React from 'react';
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

export default function CartPage() {
  const navigate = useNavigate();
  const { items, setQuantity, clearCart, totalItems, totalPrice, totalSavings } = useCart();

  const cartItems = Object.values(items).filter(({ quantity }) => quantity > 0);
  const isEmpty = cartItems.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT, fontFamily: C.SANS }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
        borderBottom: `1px solid ${C.BORDER}`, position: 'sticky', top: 0,
        background: C.BG, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: C.GOLD, cursor: 'pointer',
            fontSize: 22, lineHeight: 1, padding: 4,
          }}
          aria-label="Back"
        >
          ←
        </button>
        <span style={{ fontFamily: C.SERIF, fontSize: 22, letterSpacing: '0.15em', color: C.GOLD, fontWeight: 600 }}>
          TRÉSOR BAGS
        </span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 120px' }}>
        <h1 style={{ fontFamily: C.SERIF, fontSize: 32, fontWeight: 400, color: C.GOLD_L, marginBottom: 4 }}>
          Shopping Bag
        </h1>
        <p style={{ color: C.MUTED, fontSize: 14, marginBottom: 32 }}>
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </p>

        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '80px 16px' }}>
            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🛍️</div>
            <p style={{ fontFamily: C.SERIF, fontSize: 24, color: C.MUTED, marginBottom: 24 }}>
              Your bag is empty
            </p>
            <button
              onClick={() => navigate('/')}
              style={btnPrimary}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {cartItems.map(({ bag, quantity }) => {
                const discount = bag.typeId?.discount ?? 0;
                const unitDiscounted = bag.price * (1 - discount / 100);
                const subtotal = unitDiscounted * quantity;

                return (
                  <div
                    key={bag.id}
                    style={{
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                      padding: '20px 0', borderBottom: `1px solid ${C.BORDER}`,
                    }}
                  >
                    {/* Image */}
                    <img
                      src={bag.mainImage || bag.imageUrl || bag.image || ''}
                      alt={bag.title || bag.name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, flexShrink: 0, background: '#111' }}
                    />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: C.SERIF, fontSize: 18, color: C.GOLD, margin: '0 0 6px', fontWeight: 500 }}>
                        {bag.title || bag.name}
                      </p>

                      {/* Price */}
                      {discount > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: C.MUTED, textDecoration: 'line-through' }}>
                            {fmt(bag.price)}
                          </span>
                          <span style={{ fontSize: 15, color: C.GOLD, fontWeight: 600 }}>
                            {fmt(unitDiscounted)}
                          </span>
                          <span style={{ fontSize: 11, background: 'rgba(223,169,75,0.12)', color: C.GOLD, padding: '2px 6px', borderRadius: 3 }}>
                            -{discount}%
                          </span>
                        </div>
                      ) : (
                        <p style={{ fontSize: 15, color: C.TEXT, marginBottom: 10 }}>{fmt(bag.price)}</p>
                      )}

                      {/* Quantity selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <button
                          onClick={() => setQuantity(bag, quantity - 1)}
                          disabled={quantity <= 1}
                          style={qtyBtn(quantity <= 1)}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span style={{
                          minWidth: 36, textAlign: 'center', fontSize: 14, color: C.TEXT,
                          border: `1px solid ${C.BORDER}`, borderLeft: 'none', borderRight: 'none',
                          padding: '5px 0', userSelect: 'none',
                        }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(bag, quantity + 1)}
                          disabled={quantity >= (bag.stock ?? Infinity)}
                          style={qtyBtn(quantity >= (bag.stock ?? Infinity))}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal + remove */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontFamily: C.SERIF, fontSize: 18, color: C.GOLD_L, fontWeight: 600 }}>
                        {fmt(subtotal)}
                      </span>
                      <button
                        onClick={() => setQuantity(bag, 0)}
                        style={{
                          background: 'none', border: 'none', color: C.MUTED, cursor: 'pointer',
                          fontSize: 20, lineHeight: 1, padding: 4,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#e05'}
                        onMouseLeave={e => e.currentTarget.style.color = C.MUTED}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{
              marginTop: 32, padding: '24px', background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.BORDER}`, borderRadius: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: C.MUTED, fontSize: 14 }}>Items</span>
                <span style={{ color: C.TEXT, fontSize: 14 }}>{totalItems}</span>
              </div>
              {totalSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#5dba6e', fontSize: 14 }}>You save</span>
                  <span style={{ color: '#5dba6e', fontSize: 14, fontWeight: 600 }}>{fmt(totalSavings)}</span>
                </div>
              )}
              <div style={{ height: 1, background: C.BORDER, margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: C.SERIF, fontSize: 18, color: C.TEXT }}>Grand Total</span>
                <span style={{ fontFamily: C.SERIF, fontSize: 26, color: C.GOLD, fontWeight: 600 }}>
                  {fmt(totalPrice)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/')}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/checkout/delivery')}
                style={{ ...btnPrimary, flex: 1 }}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary = {
  background: 'linear-gradient(135deg, #dfa94b, #C9A86A)',
  color: '#080808',
  border: 'none',
  borderRadius: 4,
  padding: '14px 32px',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  textTransform: 'uppercase',
};

const btnSecondary = {
  background: 'none',
  color: '#6B6560',
  border: '1px solid rgba(201,168,106,0.25)',
  borderRadius: 4,
  padding: '14px 32px',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  letterSpacing: '0.05em',
  cursor: 'pointer',
};

function qtyBtn(disabled) {
  return {
    background: 'none',
    border: `1px solid rgba(201,168,106,0.25)`,
    color: disabled ? '#333' : '#F5F1E8',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: 32,
    height: 32,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: disabled ? undefined : undefined,
  };
}
