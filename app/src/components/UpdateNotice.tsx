import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { bridge, type UpdateStatus } from '../updates';
import { useT } from '../i18n';
import { Close } from '../icons';

/** Klein meldingetje rechtsonder als er een nieuwe versie is. */
export function UpdateNotice({ status }: { status: UpdateStatus }) {
  const t = useT();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const show =
    !!bridge &&
    (status.state === 'available' || status.state === 'ready' || status.state === 'downloading') &&
    dismissed !== `${status.state}-${status.version}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="update-notice glass"
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="un-text">
            <strong>{t('Nieuwe versie {v}', { v: status.version ?? '' })}</strong>
            <span className="muted">
              {status.state === 'downloading'
                ? t('Wordt gedownload… {p}%', { p: status.percent ?? 0 })
                : status.state === 'ready'
                  ? t('Klaar om te installeren.')
                  : t('Download hem van GitHub.')}
            </span>
          </div>
          {status.state === 'ready' && (
            <button className="btn btn-primary sm" onClick={() => bridge?.installUpdate()}>
              {t('Herstarten')}
            </button>
          )}
          {status.state === 'available' && (
            <button className="btn btn-primary sm" onClick={() => bridge?.openDownloads()}>
              {t('Downloaden')}
            </button>
          )}
          <button
            className="icon-btn sm"
            aria-label={t('Sluiten')}
            onClick={() => setDismissed(`${status.state}-${status.version}`)}
          >
            <Close width={14} height={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
