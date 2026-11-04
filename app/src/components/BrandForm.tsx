import { useState } from 'react';
import type { Brand } from '../types';
import { SWATCHES } from '../shapes';
import { readImage, removeLogoBackground } from '../files';

interface Props {
  value: Brand;
  onChange: (brand: Brand) => void;
}

/** Bedrijfsnaam, logo en accentkleur. Gebruikt bij de eerste start en in Beheer. */
export function BrandForm({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Na het uploaden: beide versies bewaren zodat je kunt wisselen.
  const [versions, setVersions] = useState<{ clean: string; original: string } | null>(null);
  const set = (patch: Partial<Brand>) => onChange({ ...value, ...patch });

  const upload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const original = await readImage(file);
      const raw = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('Bestand kon niet gelezen worden.'));
        r.readAsDataURL(file);
      });
      const clean = file.type === 'image/svg+xml' ? null : await removeLogoBackground(raw);
      setVersions(clean ? { clean, original } : null);
      set({ logo: clean ?? original });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo kon niet geladen worden.');
    } finally {
      setBusy(false);
    }
  };

  const showingClean = versions && value.logo === versions.clean;

  return (
    <div className="brand-form">
      <label className="field">
        <span>Bedrijfsnaam</span>
        <input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="bv. Jansen & Co" maxLength={40} />
      </label>

      <div className="field">
        <span>Logo</span>
        <div className="brand-logo-row">
          <div className="brand-logo-preview checker" aria-hidden="true">
            {value.logo ? <img src={value.logo} alt="" /> : <span className="logo-word">{value.name || 'Logo'}</span>}
          </div>
          <label className="btn sm file-input">
            {busy ? 'Bezig…' : value.logo ? 'Ander logo' : 'Logo uploaden'}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) upload(file);
              }}
            />
          </label>
          {value.logo && (
            <button
              type="button"
              className="link"
              onClick={() => {
                setVersions(null);
                set({ logo: undefined });
              }}
            >
              Verwijderen
            </button>
          )}
        </div>
        {versions ? (
          <small className="muted">
            {showingClean ? 'Achtergrond automatisch verwijderd. ' : 'Origineel logo met achtergrond. '}
            <button type="button" className="link" onClick={() => set({ logo: showingClean ? versions.original : versions.clean })}>
              {showingClean ? 'Origineel gebruiken' : 'Achtergrond toch verwijderen'}
            </button>
          </small>
        ) : (
          <small className="muted">
            Een effen achtergrond wordt automatisch verwijderd. Zonder logo toont de app je bedrijfsnaam rechtsboven.
          </small>
        )}
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
