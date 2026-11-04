import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Bot } from '../types';
import { External, Pencil, Star } from '../icons';

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
          <p className="info-desc">{bot.description || 'Nog geen beschrijving.'}</p>
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
                Open in Grok <External width={16} height={16} />
              </a>
            ) : (
              <button className="btn btn-primary" onClick={onEdit} title="Nog geen Grok-link ingesteld">
                Grok-link instellen
              </button>
            )}
            <button
              className={`icon-btn ${bot.favorite ? 'is-on' : ''}`}
              onClick={onFavorite}
              aria-pressed={bot.favorite}
              title="Favoriet (F)"
              aria-label="Favoriet"
            >
              <Star filled={bot.favorite} />
            </button>
            <button className="icon-btn" onClick={onEdit} title="Bewerken (E)" aria-label="Bewerken">
              <Pencil />
            </button>
          </div>
          {!bot.grokUrl && <p className="hint">Deze bot heeft nog geen Grok-link.</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
