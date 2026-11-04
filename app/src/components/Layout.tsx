import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Bot, Brand } from '../types';
import { BotIcon } from './BotFace';
import { useT } from '../i18n';
import { ChevronDown, Gear, Search, Star } from '../icons';

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
  teams: string[];
  team: string | null;
  onTeam: (team: string | null) => void;
  onToggleFavorites: () => void;
  onSearch: () => void;
  onManage: () => void;
}

export function Header({ brand, favoritesOnly, favoriteCount, teams, team, onTeam, onToggleFavorites, onSearch, onManage }: HeaderProps) {
  const t = useT();
  const logoLight = useIsLightLogo(brand?.logo);
  return (
    <header className="header">
      <div className="header-left">
        <span className="app-title mono">Bot Manager</span>
        {brand && (
          <>
            <button className="pill" onClick={onSearch}>
              <Search width={16} height={16} /> {t('Zoeken')} <kbd>/</kbd>
            </button>
            <button className={`pill ${favoritesOnly ? 'is-on' : ''}`} onClick={onToggleFavorites} aria-pressed={favoritesOnly}>
              <Star width={16} height={16} filled={favoritesOnly} /> {t('Favorieten')} <span className="mono muted">{favoriteCount}</span>
            </button>
            {teams.length > 1 && (
              <label className={`pill select-pill ${team ? 'is-on' : ''}`}>
                <select value={team ?? ''} onChange={(e) => onTeam(e.target.value || null)} aria-label={t('Afdeling')}>
                  <option value="">{t('Alle afdelingen')}</option>
                  {teams.map((tm) => (
                    <option key={tm} value={tm}>
                      {tm}
                    </option>
                  ))}
                </select>
                <ChevronDown width={14} height={14} />
              </label>
            )}
            <button className="pill" onClick={onManage}>
              <Gear width={16} height={16} /> {t('Beheer')}
            </button>
          </>
        )}
      </div>
      {brand && (
        <div className="logo" aria-label={brand.name}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className={logoLight ? 'is-light-logo' : ''} />
          ) : (
            <span className="logo-word">{brand.name}</span>
          )}
        </div>
      )}
    </header>
  );
}

/**
 * Is het logo vooral licht (wit/zilver op doorzichtig)? Dan tonen we het in het
 * lichte thema donker, anders verdwijnt het tegen de lichte achtergrond.
 */
function useIsLightLogo(src?: string) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    if (!src) return setLight(false);
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const s = Math.min(1, 120 / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      let n = 0;
      let opaque = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        opaque++;
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        n++;
      }
      // Alleen bij logo's met een doorzichtige achtergrond (anders is er een eigen vlak).
      const transparentShare = 1 - opaque / (d.length / 4);
      if (!cancelled) setLight(n > 0 && transparentShare > 0.2 && sum / n > 165);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return light;
}

export function Rail({ bots, activeId, onSelect }: { bots: Bot[]; activeId: string; onSelect: (id: string) => void }) {
  const t = useT();
  return (
    <nav className="rail" aria-label={t('Alle bots')}>
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
