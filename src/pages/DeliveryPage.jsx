import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LEBANON from '../data/lebanon';
import LocationPicker from '../components/LocationPicker';
import SiteHeader from '../components/storefront/SiteHeader';
import CheckoutSteps from '../components/storefront/CheckoutSteps';


const PHONE_PREFIXES = [
  '+961', '+1', '+44', '+33', '+49', '+39', '+34',
  '+971', '+966', '+20', '+90', '+55', '+61',
];

const INITIAL = {
  name: '',
  surname: '',
  address: '',
  moreInfo: '',
  region: '',
  lat: null,
  lng: null,
  email: '',
  phonePrefix: '+961',
  phoneNumber: '',
};

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validatePhone(v) {
  return /^\d{7,10}$/.test(v);
}

export default function DeliveryPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const regions = Object.keys(LEBANON);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function blur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function errors() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.surname.trim()) e.surname = 'Surname is required';
    if (form.lat == null || form.lng == null) e.location = 'Please set your delivery location on the map';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
    else if (!validatePhone(form.phoneNumber)) e.phoneNumber = 'Enter 7 to 10 digits';
    return e;
  }

  const errs = errors();
  const hasErrors = Object.keys(errs).length > 0;

  function showErr(field) {
    return (touched[field] || submitAttempted) && errs[field];
  }

  function handleContinue() {
    setSubmitAttempted(true);
    if (hasErrors) return;
    const mapLink = form.lat != null ? `https://www.google.com/maps?q=${form.lat},${form.lng}` : '';
    sessionStorage.setItem('tresor-delivery', JSON.stringify({ ...form, mapLink }));
    navigate('/checkout/payment');
  }

  const errId = (f) => (showErr(f) ? `${f}-error` : undefined);

  return (
    <div className="sf">
      <SiteHeader back="/cart" />
      <main className="sf-container" style={{ maxWidth: 640, paddingBlock: '32px 96px' }}>
        <CheckoutSteps step={2} />
        <h1 className="sf-h2" style={{ marginTop: 20 }}>Delivery details</h1>
        <p className="sf-muted" style={{ marginTop: 8 }}>Where should we deliver your order?</p>

        <div style={{ display: 'grid', gap: 22, marginTop: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field id="name" label="First name" error={showErr('name')}>
              <input id="name" className="sf-input" autoComplete="given-name" value={form.name}
                onChange={e => set('name', e.target.value)} onBlur={() => blur('name')}
                aria-invalid={Boolean(showErr('name'))} aria-describedby={errId('name')} />
            </Field>
            <Field id="surname" label="Last name" error={showErr('surname')}>
              <input id="surname" className="sf-input" autoComplete="family-name" value={form.surname}
                onChange={e => set('surname', e.target.value)} onBlur={() => blur('surname')}
                aria-invalid={Boolean(showErr('surname'))} aria-describedby={errId('surname')} />
            </Field>
          </div>

          <Field id="location" label="Delivery location" hint="Pin it on the map" error={showErr('location')}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--sf-line)' }}>
              <LocationPicker
                value={{ lat: form.lat, lng: form.lng }}
                onChange={({ lat, lng }) => setForm(prev => ({ ...prev, lat, lng }))}
              />
            </div>
          </Field>

          <Field id="address" label="Address details" hint="Optional">
            <input id="address" className="sf-input" autoComplete="street-address" value={form.address}
              onChange={e => set('address', e.target.value)} placeholder="Building, floor, apartment" />
          </Field>

          <Field id="moreInfo" label="Notes for the driver" hint="Optional">
            <textarea id="moreInfo" className="sf-input" rows={3} value={form.moreInfo}
              onChange={e => set('moreInfo', e.target.value)} placeholder="Landmarks, best time to call" />
          </Field>

          <Field id="region" label="Region" hint="Optional">
            <select id="region" className="sf-input" value={form.region} onChange={e => set('region', e.target.value)}
              style={{ color: form.region ? undefined : 'var(--sf-text-3)' }}>
              <option value="">Select a region</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field id="email" label="Email" error={showErr('email')}>
            <input id="email" className="sf-input" type="email" autoComplete="email" value={form.email}
              onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} placeholder="you@example.com"
              aria-invalid={Boolean(showErr('email'))} aria-describedby={errId('email')} />
          </Field>

          <Field id="phoneNumber" label="Phone" error={showErr('phoneNumber')}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="sf-input" aria-label="Country code" value={form.phonePrefix}
                onChange={e => set('phonePrefix', e.target.value)} style={{ width: 104, flexShrink: 0 }}>
                {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input id="phoneNumber" className="sf-input" value={form.phoneNumber} inputMode="tel" autoComplete="tel-national" maxLength={10}
                onChange={e => set('phoneNumber', e.target.value.replace(/\D/g, ''))} onBlur={() => blur('phoneNumber')}
                placeholder="71 234 567" aria-invalid={Boolean(showErr('phoneNumber'))} aria-describedby={errId('phoneNumber')} />
            </div>
          </Field>
        </div>

        {submitAttempted && hasErrors && (
          <p className="sf-error" role="alert" style={{ marginTop: 24 }}>Please fix the fields marked above.</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button className="sf-btn sf-btn--ghost" onClick={() => navigate('/cart')}>Back</button>
          <button className="sf-btn sf-btn--primary" style={{ flex: 1 }} onClick={handleContinue}>Continue to payment</button>
        </div>
        <p className="sf-faint" style={{ fontSize: 13, marginTop: 16 }}>
          Your details are used only for this order. <a href="/privacy" style={{ textUnderlineOffset: 3 }}>Privacy Policy</a>
        </p>
      </main>
    </div>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="sf-field">
      <label className="sf-label" htmlFor={id}>{label}{hint && <small>{hint}</small>}</label>
      {children}
      {error && <p id={`${id}-error`} className="sf-error">{error}</p>}
    </div>
  );
}
