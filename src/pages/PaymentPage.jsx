import { useEffect, useState } from 'react';
import { Check, CheckCircle, Copy } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import { sized } from '../utils/image';
import SiteHeader from '../components/storefront/SiteHeader';
import CheckoutSteps from '../components/storefront/CheckoutSteps';


function fmt(n) {
  return '$' + Number(n).toFixed(2);
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, clearCart, totalPrice, totalSavings } = useCart();
  const [delivery, setDelivery] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyNumber = () => {
    navigator.clipboard?.writeText('+96178987288').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

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

  function buildMessage(confirmToken) {
    const confirmLink = `https://tresorbags.com/admin/order/${confirmToken}`;
    const lines = [];
    lines.push('NEW ORDER - Tresor Bags');
    lines.push('');
    lines.push(`Customer: ${delivery.name} ${delivery.surname}`);
    lines.push(`Phone: ${delivery.phonePrefix}${delivery.phoneNumber}`);
    lines.push(`Email: ${delivery.email}`);
    const addr = [delivery.address, delivery.region].filter((s) => s && s.trim()).join(', ');
    if (addr) lines.push(`Address: ${addr}`);
    if (delivery.mapLink) lines.push(`Location: ${delivery.mapLink}`);
    if (delivery.moreInfo?.trim()) {
      lines.push(`Notes: ${delivery.moreInfo.trim()}`);
    }
    lines.push('');
    lines.push('Items:');
    cartItems.forEach(({ bag, quantity }) => {
      const discount = bag.typeId?.discount ?? 0;
      const unit = bag.price * (1 - discount / 100);
      const subtotal = unit * quantity;
      lines.push(`- ${bag.title} x${quantity} = ${fmt(subtotal)}`);
    });
    lines.push('');
    if (totalSavings > 0) {
      lines.push(`Total Savings: ${fmt(totalSavings)}`);
    }
    lines.push(`Grand Total: ${fmt(totalPrice)}`);
    lines.push('');
    lines.push('Payment: Whish Transfer to +961 78 987 288');
    if (confirmToken) {
      lines.push('');
      lines.push(`Confirm payment received: ${confirmLink}`);
    }
    return lines.join('\n');
  }

  async function handleConfirm() {
    if (confirming) return;
    setConfirming(true);

    // Open the WhatsApp tab *synchronously* while we're still inside the click
    // gesture. Opening it after the await below gets blocked as a pop-up on
    // desktop and stricter mobile browsers (the order saved but WhatsApp never
    // opened). We redirect this tab once we have the order token.
    const waWindow = window.open('', '_blank');

    const openWhatsApp = (token) => {
      const encoded = encodeURIComponent(buildMessage(token));
      const url = `https://wa.me/96178987288?text=${encoded}`;
      if (waWindow && !waWindow.closed) {
        waWindow.location.href = url;
      } else {
        // Pop-up was blocked — fall back to navigating the current tab.
        window.location.href = url;
      }
    };

    try {
      // Build order payload
      const orderItems = cartItems.map(({ bag, quantity }) => {
        const discount = bag.typeId?.discount ?? 0;
        const unit = bag.price * (1 - discount / 100);
        return {
          bagId: bag._id,
          title: bag.title,
          mainImage: bag.mainImage || '',
          price: bag.price,
          discount,
          quantity,
          subtotal: parseFloat((unit * quantity).toFixed(2)),
        };
      });
      const result = await createOrder({
        items: orderItems,
        delivery,
        total: parseFloat(totalPrice.toFixed(2)),
        savings: parseFloat(totalSavings.toFixed(2)),
      });
      const confirmToken = result.data?.confirmToken || '';

      openWhatsApp(confirmToken);

      clearCart();
      sessionStorage.removeItem('tresor-delivery');
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    } catch {
      // Even if order creation fails, still send WhatsApp without confirm link
      openWhatsApp('');
      clearCart();
      sessionStorage.removeItem('tresor-delivery');
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    }
  }

  const addressLine = [delivery.address, delivery.region].filter((x) => x && x.trim()).join(', ');

  if (success) {
    return (
      <div className="sf" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 14, textAlign: 'center', maxWidth: 420 }}>
          <CheckCircle size={56} weight="fill" color="#D9B26F" />
          <h1 className="sf-h2">Order sent</h1>
          <p className="sf-muted">Your order went to us on WhatsApp. We’ll confirm your payment and arrange delivery shortly.</p>
          <p className="sf-faint" style={{ fontSize: 13 }}>Taking you back to the shop…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sf">
      <style>{PAY_CSS}</style>
      <SiteHeader back="/checkout/delivery" />
      <main className="sf-container" style={{ maxWidth: 1080, paddingBlock: '32px 96px' }}>
        <CheckoutSteps step={3} />
        <h1 className="sf-h2" style={{ marginTop: 20 }}>Review and pay</h1>

        <div className="pay">
          {/* Order summary */}
          <section className="sf-panel" aria-labelledby="summary-h">
            <h2 id="summary-h" className="sf-h3">Your order</h2>
            <ul className="pay__items">
              {cartItems.map(({ bag, quantity }) => {
                const discount = bag.typeId?.discount ?? 0;
                const unit = bag.price * (1 - discount / 100);
                return (
                  <li key={bag._id || bag.id}>
                    <span className="sf-tile" style={{ width: 56, aspectRatio: '1', borderRadius: 10, flexShrink: 0 }}>
                      <img src={sized(bag.mainImage || '', 160)} alt="" style={{ padding: '10%' }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 550 }}>{bag.title}</p>
                      <p className="sf-faint sf-num" style={{ fontSize: 13 }}>{fmt(unit)} × {quantity}</p>
                    </div>
                    <span className="sf-num">{fmt(unit * quantity)}</span>
                  </li>
                );
              })}
            </ul>
            {totalSavings > 0 && (
              <p className="pay__row"><span className="sf-muted">You save</span><span className="sf-gold sf-num">{fmt(totalSavings)}</span></p>
            )}
            <p className="pay__total"><span>Total</span><span className="sf-num">{fmt(totalPrice)}</span></p>

            <div className="pay__deliver">
              <p className="sf-faint" style={{ fontSize: 13 }}>Delivering to</p>
              <p style={{ fontWeight: 550 }}>{delivery.name} {delivery.surname}</p>
              {addressLine && <p className="sf-muted" style={{ fontSize: 14 }}>{addressLine}</p>}
              <p className="sf-muted" style={{ fontSize: 14 }}>{delivery.phonePrefix} {delivery.phoneNumber}</p>
            </div>
          </section>

          {/* Payment */}
          <section style={{ display: 'grid', gap: 16, alignContent: 'start' }} aria-labelledby="pay-h">
            <div className="sf-panel" style={{ display: 'grid', gap: 14 }}>
              <h2 id="pay-h" className="sf-h3">Pay with Whish</h2>
              <p className="sf-muted">Send <b className="sf-num" style={{ color: 'var(--sf-text)' }}>{fmt(totalPrice)}</b> to this Whish number:</p>
              <button className="pay__number" onClick={copyNumber} aria-label="Copy the Whish number">
                <span className="sf-num">+961 78 987 288</span>
                <span className="sf-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                </span>
              </button>
              <p className="sf-muted" style={{ fontSize: 14 }}>Then tap Confirm order. Your order details go to us on WhatsApp and we arrange delivery. Keep your transfer receipt.</p>
            </div>
            <button className="sf-btn sf-btn--primary sf-btn--block" onClick={handleConfirm} disabled={confirming}>
              {confirming ? 'Sending…' : 'Confirm order'}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

const PAY_CSS = `
  .pay { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 24px; margin-top: 28px; align-items: start; }
  .pay__items { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 14px; }
  .pay__items li { display: flex; align-items: center; gap: 12px; }
  .pay__row, .pay__total { display: flex; justify-content: space-between; gap: 12px; }
  .pay__row { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--sf-line); }
  .pay__row + .pay__total { margin-top: 10px; padding-top: 0; border-top: 0; }
  .pay__total { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--sf-line); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  .pay__deliver { margin-top: 20px; padding: 14px 16px; border-radius: 12px; background: var(--sf-surface-2); display: grid; gap: 2px; }
  .pay__number { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; height: 60px; padding: 0 18px; border-radius: 12px; background: var(--sf-surface-2); border: 1px solid var(--sf-line); color: var(--sf-text); font: 600 22px/1 var(--sf-font); letter-spacing: -0.01em; cursor: pointer; }
  .pay__number:hover { border-color: rgba(217, 178, 111, 0.5); }
  @media (max-width: 860px) { .pay { grid-template-columns: 1fr; } }
`;
