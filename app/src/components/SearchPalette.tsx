import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { Bot } from '../types';
import { Search, Star } from '../icons';
import { useT } from '../i18n';

interface Props {
  bots: Bot[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Zoekvenster: zoekt in naam, taak, afdeling, beschrijving en tags. */
export function SearchPalette({ bots, onSelect, onClose }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bots;
    return bots.filter((b) =>
      [b.name, b.role, b.team, b.description, ...b.tags].some((f) => f.toLowerCase().includes(q)),
    );
  }, [query, bots]);

  useEffect(() => setCursor(0), [query]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && results[cursor]) {
      onSelect(results[cursor].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div
        className="palette glass"
        initial={{ y: -16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -10, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="palette-input">
          <Search />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('Zoek op naam, functie, afdeling of tag…')}
            aria-label={t('Zoeken')}
          />
          <kbd>esc</kbd>
        </div>
        <ul className="palette-list" role="listbox">
          {results.map((b, i) => (
            <li key={b.id}>
              <button
                className={`palette-item ${i === cursor ? 'is-cursor' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => onSelect(b.id)}
                role="option"
                aria-selected={i === cursor}
              >
                <span className="swatch" style={{ background: b.color }} />
                <span className="pi-name">{b.name}</span>
                <span className="pi-role">{b.role}</span>
                <span className="pi-team mono">{b.team}</span>
                {b.favorite ? <Star width={14} height={14} filled className="pi-star" /> : <span />}
              </button>
            </li>
          ))}
          {!results.length && <li className="empty">{t('Geen bots gevonden voor “{q}”.', { q: query })}</li>}
        </ul>
      </motion.div>
    </motion.div>
  );
}
