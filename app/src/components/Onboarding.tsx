import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Brand } from '../types';
import { DEFAULT_ACCENT } from '../store';
import { BrandForm } from './BrandForm';
import { BotFace } from './BotFace';

/** Eerste start: het bedrijf stelt naam, logo en kleur in. */
export function Onboarding({ onDone }: { onDone: (brand: Brand) => void }) {
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
          <span className="eyebrow">Welkom</span>
          <h1>Al je Grok-bots op één plek</h1>
          <p className="muted">
            Stel eerst je bedrijf in. Daarna voeg je je bots toe door hun Grok-links te plakken. Alles blijft op deze computer.
          </p>
          <BrandForm value={brand} onChange={setBrand} />
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={!ok}
              style={{ '--bot': brand.accent } as CSSProperties}
              onClick={() => onDone({ ...brand, name: brand.name.trim() })}
            >
              Beginnen
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
