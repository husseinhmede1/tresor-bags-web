import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LEBANON from '../data/lebanon';

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
  district: '',
  locality: '',
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
  const districts = form.region ? Object.keys(LEBANON[form.region]) : [];
  const localities = form.region && form.district ? LEBANON[form.region][form.district] ?? [] : [];

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'region') { next.district = ''; next.locality = ''; }
      if (field === 'district') { next.locality = ''; }
      return next;
    });
  }

  function blur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function errors() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.surname.trim()) e.surname = 'Surname is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.region) e.region = 'Region is required';
    if (!form.district) e.district = 'District is required';
    if (!form.locality) e.locality = 'Locality is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
    else if (!validatePhone(form.phoneNumber)) e.phoneNumber = 'Enter 7–10 digits';
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
    sessionStorage.setItem('tresor-delivery', JSON.stringify(form));
    navigate('/checkout/payment');
  }

  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT, fontFamily: C.SANS }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
        borderBottom: `1px solid ${C.BORDER}`, position: 'sticky', top: 0,
        background: C.BG, zIndex: 10,
      }}>
        <button onClick={() => navigate('/cart')} style={backBtn} aria-label="Back">←</button>
        <span style={{ fontFamily: C.SERIF, fontSize: 22, letterSpacing: '0.15em', color: C.GOLD, fontWeight: 600 }}>
          TRÉSOR BAGS
        </span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px 100px' }}>
        <h1 style={{ fontFamily: C.SERIF, fontSize: 32, fontWeight: 400, color: C.GOLD_L, marginBottom: 4 }}>
          Delivery Details
        </h1>
        <p style={{ color: C.MUTED, fontSize: 14, marginBottom: 36 }}>
          Step 1 of 2 — Where should we deliver your order?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Name + Surname */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Name" error={showErr('name')}>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onBlur={() => blur('name')}
                placeholder="First name"
                style={inputStyle(showErr('name'))}
              />
            </Field>
            <Field label="Surname" error={showErr('surname')}>
              <input
                value={form.surname}
                onChange={e => set('surname', e.target.value)}
                onBlur={() => blur('surname')}
                placeholder="Last name"
                style={inputStyle(showErr('surname'))}
              />
            </Field>
          </div>

          {/* Address */}
          <Field label="Address" error={showErr('address')}>
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              onBlur={() => blur('address')}
              placeholder="Street address, building, floor..."
              style={inputStyle(showErr('address'))}
            />
          </Field>

          {/* More info */}
          <Field label="More Information" hint="Optional">
            <textarea
              value={form.moreInfo}
              onChange={e => set('moreInfo', e.target.value)}
              placeholder="Delivery notes, landmarks, etc."
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.5 }}
            />
          </Field>

          {/* Region */}
          <Field label="Region" error={showErr('region')}>
            <select
              value={form.region}
              onChange={e => { set('region', e.target.value); blur('region'); }}
              onBlur={() => blur('region')}
              style={selectStyle(showErr('region'), !form.region)}
            >
              <option value="">Select region...</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {/* District */}
          <Field label="District" error={showErr('district')}>
            <select
              value={form.district}
              onChange={e => { set('district', e.target.value); blur('district'); }}
              onBlur={() => blur('district')}
              disabled={!form.region}
              style={selectStyle(showErr('district'), !form.district)}
            >
              <option value="">Select district...</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          {/* Locality */}
          <Field label="Locality" error={showErr('locality')}>
            <select
              value={form.locality}
              onChange={e => { set('locality', e.target.value); blur('locality'); }}
              onBlur={() => blur('locality')}
              disabled={!form.district}
              style={selectStyle(showErr('locality'), !form.locality)}
            >
              <option value="">Select locality...</option>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          {/* Email */}
          <Field label="E-mail" error={showErr('email')}>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => blur('email')}
              placeholder="your@email.com"
              style={inputStyle(showErr('email'))}
            />
          </Field>

          {/* Phone */}
          <Field label="Telephone" error={showErr('phoneNumber')}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={form.phonePrefix}
                onChange={e => set('phonePrefix', e.target.value)}
                style={{ ...selectStyle(false, false), width: 90, flexShrink: 0 }}
              >
                {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                value={form.phoneNumber}
                onChange={e => set('phoneNumber', e.target.value.replace(/\D/g, ''))}
                onBlur={() => blur('phoneNumber')}
                placeholder="79999999"
                maxLength={10}
                inputMode="tel"
                style={{ ...inputStyle(showErr('phoneNumber')), flex: 1 }}
              />
            </div>
          </Field>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cart')} style={btnSecondary}>Back</button>
          <button onClick={handleContinue} style={{ ...btnPrimary, flex: 1 }}>Continue</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <label style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A86A' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: '#6B6560' }}>{hint}</span>}
      </div>
      {children}
      {error && <p style={{ fontSize: 12, color: '#e05', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${hasError ? '#e05' : 'rgba(201,168,106,0.2)'}`,
    borderRadius: 4,
    color: '#F5F1E8',
    fontSize: 15,
    padding: '12px 14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
}

function selectStyle(hasError, isPlaceholder) {
  return {
    width: '100%',
    background: '#0e0e0e',
    border: `1px solid ${hasError ? '#e05' : 'rgba(201,168,106,0.2)'}`,
    borderRadius: 4,
    color: isPlaceholder ? '#6B6560' : '#F5F1E8',
    fontSize: 15,
    padding: '12px 14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'auto',
  };
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
  cursor: 'pointer',
};

const backBtn = {
  background: 'none',
  border: 'none',
  color: '#dfa94b',
  cursor: 'pointer',
  fontSize: 22,
  lineHeight: 1,
  padding: 4,
};
