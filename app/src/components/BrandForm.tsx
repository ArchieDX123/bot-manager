import { useState } from 'react';
import type { Brand } from '../types';
import { SWATCHES } from '../shapes';
import { readImage } from '../files';

interface Props {
  value: Brand;
  onChange: (brand: Brand) => void;
}

/** Bedrijfsnaam, logo en accentkleur. Gebruikt bij de eerste start en in Beheer. */
export function BrandForm({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Brand>) => onChange({ ...value, ...patch });

  return (
    <div className="brand-form">
      <label className="field">
        <span>Bedrijfsnaam</span>
        <input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="bv. Jansen & Co" maxLength={40} />
      </label>

      <div className="field">
        <span>Logo</span>
        <div className="brand-logo-row">
          <div className="brand-logo-preview" aria-hidden="true">
            {value.logo ? <img src={value.logo} alt="" /> : <span className="logo-word">{value.name || 'Logo'}</span>}
          </div>
          <label className="btn sm file-input">
            {value.logo ? 'Ander logo' : 'Logo uploaden'}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  setError(null);
                  set({ logo: await readImage(file) });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Logo kon niet geladen worden.');
                }
              }}
            />
          </label>
          {value.logo && (
            <button type="button" className="link" onClick={() => set({ logo: undefined })}>
              Verwijderen
            </button>
          )}
        </div>
        <small className="muted">Zonder logo toont de app je bedrijfsnaam rechtsboven.</small>
        {error && <small className="err">{error}</small>}
      </div>

      <div className="field">
        <span>Accentkleur</span>
        <div className="swatches left">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch-btn ${value.accent.toLowerCase() === c.toLowerCase() ? 'is-on' : ''}`}
              style={{ background: c }}
              onClick={() => set({ accent: c })}
              aria-label={`Accentkleur ${c}`}
            />
          ))}
          <label className="swatch-btn custom" title="Eigen kleur">
            <input type="color" value={value.accent} onChange={(e) => set({ accent: e.target.value })} aria-label="Eigen accentkleur" />
          </label>
        </div>
      </div>
    </div>
  );
}
