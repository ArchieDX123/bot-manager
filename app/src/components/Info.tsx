import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Bot } from '../types';
import { External, Pencil, Star } from '../icons';
import { useT } from '../i18n';
import { hasBotLink } from '../grok';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  bot: Bot;
  index: number;
  total: number;
  direction: number;
  onFavorite: () => void;
  onEdit: () => void;
}

/** Rechts: alle informatie over de gekozen bot. */
export function Info({ bot, index, total, direction, onFavorite, onEdit }: Props) {
  const t = useT();
  return (
    <section className="info">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={bot.id}
          custom={direction}
          initial={{ opacity: 0, y: direction * 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }}
          exit={{ opacity: 0, y: direction * -16, transition: { duration: 0.22 } }}
          className="info-inner"
        >
          <div className="info-meta mono">
            <span>
              {String(index + 1).padStart(2, '0')} — {String(total).padStart(2, '0')}
            </span>
            <span className="dot" style={{ background: bot.color }} />
            <span>{bot.team}</span>
          </div>
          <h1 className={`info-name ${bot.name.length > 14 ? 'is-long' : ''}`}>{bot.name}</h1>
          {bot.role && (
            <p className="info-role" style={{ color: bot.color }}>
              {bot.role}
            </p>
          )}
          <p className="info-desc">{bot.description || t('Nog geen beschrijving.')}</p>
          {bot.tags.length > 0 && (
            <ul className="tags">
              {bot.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <div className="actions">
            {bot.grokUrl ? (
              <a
                className="btn btn-primary"
                href={bot.grokUrl}
                target="_blank"
                rel="noreferrer"
                style={{ '--bot': bot.color } as CSSProperties}
              >
                {t('Open in Grok')} <External width={16} height={16} />
              </a>
            ) : (
              <button className="btn btn-primary" onClick={onEdit} title={t('Nog geen Grok-link ingesteld')}>
                {t('Grok-link instellen')}
              </button>
            )}
            <button
              className={`icon-btn ${bot.favorite ? 'is-on' : ''}`}
              onClick={onFavorite}
              aria-pressed={bot.favorite}
              title={t('Favoriet (F)')}
              aria-label={t('Favoriet')}
            >
              <Star filled={bot.favorite} />
            </button>
            <button className="icon-btn" onClick={onEdit} title={t('Bewerken (E)')} aria-label={t('Bewerken')}>
              <Pencil />
            </button>
          </div>
          {!hasBotLink(bot.grokUrl) && <p className="hint">{t('Deze bot heeft nog geen eigen Grok-link. Voeg hem toe via Beheer.')}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
