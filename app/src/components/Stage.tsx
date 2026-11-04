import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Bot } from '../types';
import { BotFace } from './BotFace';
import { ChevronDown, ChevronUp } from '../icons';
import { useT } from '../i18n';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  bot: Bot;
  direction: number;
  tracking: boolean;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  teamIndex: { pos: number; total: number };
}

/** Links: de grote cirkel met de bot, pijltjes erboven en eronder. */
export function Stage({ bot, direction, tracking, onPrev, onNext, canPrev, canNext, teamIndex }: Props) {
  const t = useT();
  return (
    <section className="stage">
      <div className="team-panel glass">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={bot.team}
            className="team-panel-inner"
            initial={{ opacity: 0, y: direction * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction * -10 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <span className="eyebrow">{t('Afdeling')}</span>
            <span className="team-name">{bot.team}</span>
          </motion.div>
        </AnimatePresence>
        <span className="team-count mono">
          {String(teamIndex.pos).padStart(2, '0')}
          <i>/</i>
          {String(teamIndex.total).padStart(2, '0')}
        </span>
      </div>

      <button className="nav-btn" onClick={onPrev} disabled={!canPrev} aria-label={t('Vorige bot (pijl omhoog)')}>
        <ChevronUp width={22} height={22} />
      </button>

      <div className="ring glass" style={{ '--bot': bot.color } as CSSProperties}>
        <div className="ring-inner">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={bot.id}
              custom={direction}
              variants={{
                enter: (d: number) => ({ y: d * 120, opacity: 0, scale: 0.9, filter: 'blur(6px)' }),
                center: { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
                exit: (d: number) => ({ y: d * -120, opacity: 0, scale: 0.9, filter: 'blur(6px)' }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
              className="avatar-slot"
            >
              <BotFace bot={bot} tracking={tracking} size="var(--avatar)" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button className="nav-btn" onClick={onNext} disabled={!canNext} aria-label={t('Volgende bot (pijl omlaag)')}>
        <ChevronDown width={22} height={22} />
      </button>
    </section>
  );
}
