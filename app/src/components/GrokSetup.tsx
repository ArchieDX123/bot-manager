import { useEffect, useMemo, useState, type ClipboardEvent, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import type { Bot, BotDraft } from '../types';
import { SHAPE_KEYS, SWATCHES } from '../shapes';
import { SETUP_PROMPT, SETUP_PROMPT_EN, nameKey, parseSetupAnswer, type SetupItem } from '../grokSetup';
import { useLang, useT } from '../i18n';
import { detectBots, type DetectedBot } from '../screenshot';
import { BotIcon } from './BotFace';
import { Close } from '../icons';

interface Props {
  existing: Bot[];
  onApply: (items: BotDraft[], opts: { update: boolean; reorder: boolean }) => void;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** Alle bots in één keer instellen: screenshot + prompt in Grok, antwoord terug in de app. */
export function GrokSetup({ existing, onApply, onClose }: Props) {
  const t = useT();
  const prompt = useLang() === 'en' ? SETUP_PROMPT_EN : SETUP_PROMPT;
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState('');
  const [shot, setShot] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedBot[] | null>(null);
  const [shotError, setShotError] = useState<string | null>(null);
  const [update, setUpdate] = useState(true);
  const [reorder, setReorder] = useState(true);

  const parsed = useMemo((): { items: SetupItem[]; error: string | null } => {
    try {
      return { items: parseSetupAnswer(answer), error: null };
    } catch (e) {
      return { items: [], error: t(e instanceof Error ? e.message : 'Antwoord kon niet gelezen worden.') };
    }
  }, [answer]);

  // Screenshot analyseren zodra hij er is
  useEffect(() => {
    if (!shot) {
      setDetected(null);
      return;
    }
    let cancelled = false;
    detectBots(shot)
      .then((d) => !cancelled && (setDetected(d), setShotError(null)))
      .catch((e) => !cancelled && setShotError(t(e instanceof Error ? e.message : 'Screenshot kon niet gelezen worden.')));
    return () => {
      cancelled = true;
    };
  }, [shot]);

  const useShotColors = !!detected && detected.length === parsed.items.length && parsed.items.length > 0;
  const existingKeys = useMemo(() => new Set(existing.map((b) => nameKey(b.name))), [existing]);

  const drafts: BotDraft[] = parsed.items.map((it, i) => {
    const d = useShotColors ? detected![i] : undefined;
    return {
      name: it.name,
      team: it.team,
      role: it.role,
      description: it.description,
      tags: it.tags,
      color: d?.color ?? it.color ?? SWATCHES[(i + 1) % SWATCHES.length],
      shape: d?.shape ?? it.shape ?? SHAPE_KEYS[(i * 4 + 1) % SHAPE_KEYS.length],
      grokUrl: '',
    };
  });
  const updates = drafts.filter((d) => existingKeys.has(nameKey(d.name))).length;
  const news = drafts.length - updates;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const readFile = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => setShot(String(r.result));
    r.readAsDataURL(file);
  };
  const onPaste = (e: ClipboardEvent) => {
    const img = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
    if (img) {
      e.preventDefault();
      readFile(img.getAsFile());
    }
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    readFile(e.dataTransfer.files?.[0]);
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div
        className="modal glass setup"
        onMouseDown={(e) => e.stopPropagation()}
        onPaste={onPaste}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-label={t('Automatisch instellen met Grok')}
      >
        <div className="modal-head">
          <h2>{t('Automatisch instellen met Grok')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('Sluiten')}>
            <Close />
          </button>
        </div>

        <ol className="setup-steps">
          <li className="setup-step">
            <span className="step-no mono">01</span>
            <div className="step-body">
              <h3>{t('Neem een screenshot van al je bots')}</h3>
              <p>
                {t('Open Grok en zorg dat je volledige lijst met bots in één keer zichtbaar is. Maak er een screenshot van met')}{' '}
                <kbd>{isMac ? '⌘' : 'Win'}</kbd> <kbd>Shift</kbd> <kbd>{isMac ? '4' : 'S'}</kbd>.
              </p>
              <p className="muted small">{t('Past niet alles? Zoom uit met')} <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> <kbd>−</kbd>.</p>
            </div>
            <ScreenshotIllustration />
          </li>

          <li className="setup-step">
            <span className="step-no mono">02</span>
            <div className="step-body">
              <h3>{t('Steek deze prompt in je Grok-bot')}</h3>
              <p>
                {t('Plak de prompt én de screenshot in een gesprek met een bot die je andere bots kent, bijvoorbeeld je CEO-bot. Grok maakt dan een overzicht van wie wat doet.')}
              </p>
              <div className="prompt-box">
                <pre className="mono">{prompt}</pre>
                <button type="button" className={`btn sm ${copied ? 'is-done' : 'btn-primary'}`} onClick={copy}>
                  {copied ? t('Gekopieerd ✓') : t('Kopieer prompt')}
                </button>
              </div>
            </div>
          </li>

          <li className="setup-step">
            <span className="step-no mono">03</span>
            <div className="step-body">
              <h3>{t('Plak het antwoord van Grok hier')}</h3>
              <p>{t('Kopieer het volledige antwoord, inclusief het codeblok. De app leest het en stelt al je bots in.')}</p>
              <div className="fields single">
                <label>
                  {t('Antwoord van Grok')}
                  <textarea
                    rows={4}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={'Bots per team …\n```json\n{ "bots": [ … ] }\n```'}
                    spellCheck={false}
                  />
                </label>
              </div>
              {answer.trim() && parsed.error && <p className="note err">{parsed.error}</p>}

              <label
                className={`dropzone ${shot ? 'has-shot' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                {shot ? (
                  <span className="shot-preview">
                    <img src={shot} alt={t('Jouw screenshot')} />
                    {detected?.map((d, i) => (
                      <i
                        key={i}
                        style={{
                          left: `${d.box.x * 100}%`,
                          top: `${d.box.y * 100}%`,
                          width: `${d.box.w * 100}%`,
                          height: `${d.box.h * 100}%`,
                        }}
                      />
                    ))}
                  </span>
                ) : null}
                <span className="dropzone-text">
                  {shot
                    ? detected
                      ? t('{n} icoontjes herkend. Klik om een andere screenshot te kiezen.', { n: detected.length })
                      : t('Screenshot lezen…')
                    : t('Optioneel: sleep je screenshot hierheen, plak hem met Ctrl+V of klik om te kiezen. Dan neemt de app de exacte kleuren over.')}
                </span>
                <input type="file" accept="image/*" onChange={(e) => (readFile(e.target.files?.[0]), (e.target.value = ''))} />
              </label>
              {shotError && <p className="note err">{shotError}</p>}
              {detected && parsed.items.length > 0 && !useShotColors && (
                <p className="note muted">
                  {t('Op de screenshot zie ik {a} icoontjes en Grok noemt {b} bots. Ik gebruik de kleuren die Grok opgeeft.', { a: detected.length, b: parsed.items.length })}
                </p>
              )}
            </div>
          </li>
        </ol>

        {drafts.length > 0 && (
          <section className="setup-result">
            <h3 className="eyebrow">
              {t('Klaar om in te stellen: {n} bots ({a} nieuw, {b} bijwerken)', { n: drafts.length, a: news, b: updates })}
            </h3>
            <ul className="import-list setup-list">
              {drafts.map((d) => {
                const known = existingKeys.has(nameKey(d.name));
                return (
                  <li key={d.name}>
                    <BotIcon bot={d} className="import-icon" />
                    <span className="sr-name">
                      {d.name}
                      <small>{[d.team, d.role].filter(Boolean).join(' · ')}</small>
                    </span>
                    <span className={`badge mono ${known ? '' : 'is-new'}`}>{known ? t('bijwerken') : t('nieuw')}</span>
                  </li>
                );
              })}
            </ul>
            <div className="row">
              <label className="toggle">
                <input type="checkbox" checked={update} onChange={(e) => setUpdate(e.target.checked)} />
                {t('Bestaande bots bijwerken (Grok-links en favorieten blijven)')}
              </label>
              <label className="toggle">
                <input type="checkbox" checked={reorder} onChange={(e) => setReorder(e.target.checked)} />
                {t('Volgorde van Grok overnemen')}
              </label>
            </div>
          </section>
        )}

        <div className="modal-foot">
          <span className="muted small">{t('Je screenshot blijft op deze computer.')}</span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            {t('Annuleren')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!drafts.length}
            onClick={() => onApply(drafts, { update, reorder })}
          >
            {drafts.length ? t('{n} bots instellen', { n: drafts.length }) : t('Bots instellen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Tekening: een lijst met bots zoals in Grok, met een screenshot-kader eromheen. */
function ScreenshotIllustration() {
  const rows = [
    { c: '#F2F2F0', s: 'star' as const, w: 46 },
    { c: '#FF6A13', s: 'squircle' as const, w: 78 },
    { c: '#22C267', s: 'squircle' as const, w: 58 },
    { c: '#FF3D4F', s: 'squircle' as const, w: 70 },
    { c: '#8B5CF6', s: 'squircle' as const, w: 64 },
    { c: '#16B39E', s: 'squircle' as const, w: 52 },
  ];
  return (
    <svg className="setup-illustration" viewBox="0 0 220 200" role="img" aria-label={useT()('Voorbeeld: screenshot van de botlijst in Grok')}>
      <rect x="20" y="10" width="180" height="180" rx="12" fill="#17191d" stroke="#ffffff1a" />
      <rect x="32" y="20" width="60" height="7" rx="3.5" fill="#ffffff26" />
      {rows.map((r, i) => {
        const y = 38 + i * 25;
        return (
          <g key={i}>
            <g transform={`translate(32 ${y}) scale(0.1)`}>
              <BotIconPaths color={r.c} shape={r.s} />
            </g>
            <rect x="58" y={y + 3} width={r.w} height="6" rx="3" fill="#ffffffd9" />
            <rect x="58" y={y + 12} width={r.w + 40} height="5" rx="2.5" fill="#ffffff40" />
          </g>
        );
      })}
      <rect x="12" y="4" width="196" height="192" rx="16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="7 5" />
      <g transform="translate(190 182)">
        <circle r="13" fill="var(--accent)" />
        <path d="M-5 -2h2l1.5-2.5h3L3 -2h2v6.5h-10z" fill="none" stroke="#0b0d10" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cy="1.2" r="2" fill="none" stroke="#0b0d10" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

function BotIconPaths({ color, shape }: { color: string; shape: Bot['shape'] }) {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" overflow="visible">
      <BotIcon bot={{ color, shape }} />
    </svg>
  );
}
