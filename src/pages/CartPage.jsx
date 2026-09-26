import { useNavigate } from 'react-router-dom';
import { Handbag, Minus, Plus, X } from '@phosphor-icons/react';
import { useCart } from '../context/CartContext';
import { sized } from '../utils/image';
import SiteHeader from '../components/storefront/SiteHeader';
import CheckoutSteps from '../components/storefront/CheckoutSteps';

const fmt = (n) => '$' + Number(n).toFixed(2);

export default function CartPage() {
  const navigate = useNavigate();
  const { items, setQuantity, totalItems, totalPrice, totalSavings } = useCart();

  const cartItems = Object.values(items).filter(({ quantity }) => quantity > 0);
  const isEmpty = cartItems.length === 0;

  return (
    <div className="sf">
      <style>{CART_CSS}</style>
      <SiteHeader back="/" />

      <main className="sf-container" style={{ maxWidth: 1080, paddingBlock: '32px 96px' }}>
        {!isEmpty && <CheckoutSteps step={1} />}
        <h1 className="sf-h2" style={{ marginTop: isEmpty ? 24 : 20 }}>Your bag</h1>
        {!isEmpty && <p className="sf-faint sf-num" style={{ marginTop: 6, fontSize: 14 }}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>}

        {isEmpty ? (
          <div className="sf-panel" style={{ marginTop: 32, padding: '64px 24px', display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
            <Handbag size={40} color="#8C867E" />
            <h2 className="sf-h3">Your bag is empty</h2>
            <p className="sf-muted" style={{ maxWidth: '36ch' }}>Add a bag from the collection and it will wait for you here.</p>
            <button className="sf-btn sf-btn--primary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Browse the collection</button>
          </div>
        ) : (
          <div className="cart">
            <ul className="cart__list">
              {cartItems.map(({ bag, quantity }) => {
                const discount = bag.typeId?.discount ?? 0;
                const unit = bag.price * (1 - discount / 100);
                return (
                  <li key={bag._id || bag.id} className="cart__item">
                    <button className="sf-tile cart__thumb" onClick={() => navigate(`/gallery/${bag._id}`)} aria-label={`View ${bag.title}`}>
                      <img src={sized(bag.mainImage || '', 200)} alt="" />
                    </button>
                    <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
                      <p className="sf-h3" style={{ fontSize: 16 }}>{bag.title}</p>
                      <p className="sf-price" style={{ fontSize: 14 }}>
                        <span className="sf-muted">{fmt(unit)}</span>
                        {discount > 0 && <s>{fmt(bag.price)}</s>}
                      </p>
                      <div className="sf-stepper" style={{ marginTop: 8, width: 'fit-content' }} aria-label={`${bag.title} quantity`}>
                        <button onClick={() => setQuantity(bag, quantity - 1)} disabled={quantity <= 1} aria-label="Remove one"><Minus size={14} /></button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(bag, quantity + 1)} disabled={quantity >= (bag.stock ?? Infinity)} aria-label="Add one"><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="cart__end">
                      <span className="sf-num" style={{ fontWeight: 600 }}>{fmt(unit * quantity)}</span>
                      <button className="sf-icon-btn" onClick={() => setQuantity(bag, 0)} aria-label={`Remove ${bag.title}`}><X size={18} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="sf-panel cart__summary">
              <h2 className="sf-h3">Summary</h2>
              <dl className="cart__rows">
                <div><dt>Items</dt><dd className="sf-num">{totalItems}</dd></div>
                {totalSavings > 0 && <div><dt>You save</dt><dd className="sf-num sf-gold">{fmt(totalSavings)}</dd></div>}
                <div><dt>Delivery</dt><dd>Confirmed on WhatsApp</dd></div>
              </dl>
              <div className="cart__total">
                <span>Total</span>
                <span className="sf-num">{fmt(totalPrice)}</span>
              </div>
              <button className="sf-btn sf-btn--primary sf-btn--block" onClick={() => navigate('/checkout/delivery')}>Checkout</button>
              <button className="sf-btn sf-btn--ghost sf-btn--block" onClick={() => navigate('/')}>Keep shopping</button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

const CART_CSS = `
  .cart { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 32px; margin-top: 32px; align-items: start; }
  .cart__list { list-style: none; margin: 0; padding: 0; display: grid; }
  .cart__item { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 16px; align-items: start; padding-block: 20px; }
  .cart__item + .cart__item { border-top: 1px solid var(--sf-line); }
  .cart__item:first-child { padding-top: 0; }
  .cart__thumb { width: 96px; aspect-ratio: 1; border-radius: 12px; }
  .cart__thumb img { padding: 10%; }
  .cart__end { display: grid; justify-items: end; gap: 8px; }
  .cart__summary { position: sticky; top: 96px; display: grid; gap: 16px; }
  .cart__rows { margin: 0; display: grid; gap: 10px; font-size: 15px; }
  .cart__rows div { display: flex; justify-content: space-between; gap: 12px; }
  .cart__rows dt { color: var(--sf-text-2); }
  .cart__rows dd { margin: 0; text-align: right; }
  .cart__total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 16px; border-top: 1px solid var(--sf-line); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  @media (max-width: 860px) {
    .cart { grid-template-columns: 1fr; }
    .cart__summary { position: static; }
    .cart__item { grid-template-columns: 76px minmax(0, 1fr) auto; gap: 12px; }
    .cart__thumb { width: 76px; }
  }
`;
