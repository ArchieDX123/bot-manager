import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Brand } from '../types';
import { DEFAULT_ACCENT } from '../store';
import { BrandForm } from './BrandForm';
import { BotFace } from './BotFace';
import { useT } from '../i18n';

/** Eerste start: het bedrijf stelt naam, logo en kleur in. */
export function Onboarding({
  onDone,
  language,
  onLanguage,
}: {
  onDone: (brand: Brand) => void;
  language: 'nl' | 'en';
  onLanguage: (l: 'nl' | 'en') => void;
}) {
  const t = useT();
  const [brand, setBrand] = useState<Brand>({ name: '', accent: DEFAULT_ACCENT });
  const ok = brand.name.trim().length > 0;

  return (
    <main className="main onboarding">
      <motion.div
        className="onboarding-card glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="onboarding-face">
          <BotFace bot={{ name: 'Bot Manager', role: '', color: brand.accent, shape: 'star' }} tracking size={150} />
        </div>
        <div className="onboarding-body">
          <div className="onboarding-top">
            <span className="eyebrow">{t('Welkom')}</span>
            <div className="lang-switch" role="radiogroup" aria-label="Taal / Language">
              {(['nl', 'en'] as const).map((l) => (
                <button key={l} role="radio" aria-checked={language === l} className={language === l ? 'is-on' : ''} onClick={() => onLanguage(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <h1>{t('Al je Grok-bots op één plek')}</h1>
          <p className="muted">
            {t('Stel eerst je bedrijf in. Daarna laat je Grok al je bots in één keer instellen. Alles blijft op deze computer.')}
          </p>
          <BrandForm value={brand} onChange={setBrand} />
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={!ok}
              style={{ '--bot': brand.accent } as CSSProperties}
              onClick={() => onDone({ ...brand, name: brand.name.trim() })}
            >
              {t('Beginnen')}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
