import { motion } from 'framer-motion';
import type { Bot, Brand } from '../types';
import { BotIcon } from './BotFace';
import { Gear, Search, Star } from '../icons';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Background({ color, showGrid }: { color: string; showGrid: boolean }) {
  return (
    <div className="bg" aria-hidden="true">
      <motion.div
        className="bg-field"
        animate={{ background: `radial-gradient(60% 55% at 42% 50%, ${color}2e 0%, transparent 70%)` }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      {showGrid && <div className="bg-grid" />}
      <div className="bg-vignette" />
      <div className="bg-noise" />
    </div>
  );
}

interface HeaderProps {
  brand: Brand | null;
  favoritesOnly: boolean;
  favoriteCount: number;
  onToggleFavorites: () => void;
  onSearch: () => void;
  onManage: () => void;
}

export function Header({ brand, favoritesOnly, favoriteCount, onToggleFavorites, onSearch, onManage }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="app-title mono">Bot Manager</span>
        {brand && <>
        <button className="pill" onClick={onSearch}>
          <Search width={16} height={16} /> Zoeken <kbd>/</kbd>
        </button>
        <button className={`pill ${favoritesOnly ? 'is-on' : ''}`} onClick={onToggleFavorites} aria-pressed={favoritesOnly}>
          <Star width={16} height={16} filled={favoritesOnly} /> Favorieten <span className="mono muted">{favoriteCount}</span>
        </button>
        <button className="pill" onClick={onManage}>
          <Gear width={16} height={16} /> Beheer
        </button>
        </>}
      </div>
      {brand && (
        <div className="logo" aria-label={brand.name}>
          {brand.logo ? <img src={brand.logo} alt={brand.name} /> : <span className="logo-word">{brand.name}</span>}
        </div>
      )}
    </header>
  );
}

export function Rail({ bots, activeId, onSelect }: { bots: Bot[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <nav className="rail" aria-label="Alle bots">
      {bots.map((b) => (
        <button
          key={b.id}
          className={`rail-item ${b.id === activeId ? 'is-active' : ''}`}
          onClick={() => onSelect(b.id)}
          title={`${b.name} · ${b.team}`}
          aria-current={b.id === activeId}
        >
          <BotIcon bot={b} className="rail-icon" />
          <span className="rail-label">{b.name}</span>
        </button>
      ))}
    </nav>
  );
}
