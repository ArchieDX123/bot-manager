import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Store, ImportMode } from '../store';
import type { Bot, Settings } from '../types';
import { BrandForm } from './BrandForm';
import { BotIcon } from './BotFace';
import { hasBotLink } from '../grok';
import { useT } from '../i18n';
import { bridge, type UpdateStatus } from '../updates';
import { ArrowDown, ArrowUp, Close, Download, Grip, Link, Logout, Pencil, Plus, Sparkle, Star, Trash, Upload } from '../icons';

interface Props {
  store: Store;
  update: { status: UpdateStatus; version: string | null };
  onEdit: (id: string) => void;
  onNew: () => void;
  onGrokImport: () => void;
  onGrokSetup: () => void;
  onSelect: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

/** Zijpaneel om bots, bedrijfsgegevens, back-ups, weergave en updates te beheren. */
export function Manager({ store, update, onEdit, onNew, onGrokImport, onGrokSetup, onSelect, onLogout, onClose }: Props) {
  const t = useT();
  const { bots, brand, setBrand, settings, setSettings } = store;
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const missing = bots.filter((b) => !hasBotLink(b.grokUrl));
  const setSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  const importFile = async (file: File) => {
    try {
      const n = await store.importJson(file, mode);
      setNote({
        type: 'ok',
        text: mode === 'merge' ? t('{n} bots geïmporteerd (samengevoegd).', { n }) : t('{n} bots geïmporteerd (vervangen).', { n }),
      });
    } catch (e) {
      setNote({ type: 'err', text: t(e instanceof Error ? e.message : 'Importeren mislukt.') });
    }
  };

  return (
    <motion.div className="overlay overlay-right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.aside
        className="drawer glass"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 30, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        aria-label={t('Beheer')}
      >
        <div className="modal-head">
          <h2>
            {t('Beheer')} <span className="mono muted">{t('{n} bots', { n: bots.length })}</span>
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Sluiten')}>
            <Close />
          </button>
        </div>

        <button className="btn btn-primary wide" onClick={onGrokSetup}>
          <Sparkle width={16} height={16} /> {t('Automatisch instellen met Grok')}
        </button>
        <div className="row two">
          <button className="btn" onClick={onGrokImport}>
            <Link width={16} height={16} /> {t('Grok-links plakken')}
          </button>
          <button className="btn" onClick={onNew}>
            <Plus width={16} height={16} /> {t('Zelf maken')}
          </button>
        </div>

        {bots.length === 0 && <p className="note muted">{t('Nog geen bots. Laat Grok ze in één keer instellen.')}</p>}
        {bots.length > 1 && <p className="note muted small">{t('Sleep een bot om de volgorde te veranderen.')}</p>}
        <ul className="manage-list">
          {bots.map((b, i) => (
            <li
              key={b.id}
              className={`manage-row ${dragId === b.id ? 'is-dragging' : ''} ${overId === b.id && dragId !== b.id ? 'is-over' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragId(b.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', b.id);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                if (overId !== b.id) setOverId(b.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) store.moveBotTo(dragId, b.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
            >
              <span className="grip" aria-hidden="true">
                <Grip width={14} height={14} />
              </span>
              <span className="swatch" style={{ background: b.color }} />
              <button className="mr-main" onClick={() => onSelect(b.id)}>
                <span className="mr-name">
                  {b.name} {b.favorite && <Star width={12} height={12} filled className="pi-star" />}
                </span>
                <span className="mr-sub">
                  {[b.role, b.team].filter(Boolean).join(' · ')}
                  {!hasBotLink(b.grokUrl) && ` · ${t('geen Grok-link')}`}
                </span>
              </button>
              <div className="mr-actions">
                <button className="icon-btn sm" onClick={() => store.moveBot(b.id, -1)} disabled={i === 0} title={t('Omhoog')} aria-label={t('Omhoog')}>
                  <ArrowUp width={15} height={15} />
                </button>
                <button
                  className="icon-btn sm"
                  onClick={() => store.moveBot(b.id, 1)}
                  disabled={i === bots.length - 1}
                  title={t('Omlaag')}
                  aria-label={t('Omlaag')}
                >
                  <ArrowDown width={15} height={15} />
                </button>
                <button className="icon-btn sm" onClick={() => onEdit(b.id)} title={t('Bewerken')} aria-label={t('Bewerken')}>
                  <Pencil width={15} height={15} />
                </button>
                {confirmId === b.id ? (
                  <button
                    className="btn btn-danger sm"
                    onClick={() => {
                      store.removeBot(b.id);
                      setConfirmId(null);
                    }}
                  >
                    {t('Bevestig')}
                  </button>
                ) : (
                  <button className="icon-btn sm" onClick={() => setConfirmId(b.id)} title={t('Verwijderen')} aria-label={t('Verwijderen')}>
                    <Trash width={15} height={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {missing.length > 0 && <LinkFixer bots={missing} onSave={(id, url) => store.updateBot(id, { grokUrl: url })} />}

        {brand && (
          <section className="drawer-section">
            <h3>{t('Bedrijf')}</h3>
            <BrandForm value={brand} onChange={(b) => setBrand({ ...b, name: b.name || brand.name })} />
          </section>
        )}

        <section className="drawer-section">
          <h3>{t('Back-up')}</h3>
          <div className="row">
            <button className="btn" onClick={store.exportJson}>
              <Download width={16} height={16} /> {t('Exporteren')}
            </button>
            <button className="btn" onClick={() => fileInput.current?.click()}>
              <Upload width={16} height={16} /> {t('Importeren')}
            </button>
            <select value={mode} onChange={(e) => setMode(e.target.value as ImportMode)} aria-label={t('Importmodus')}>
              <option value="merge">{t('samenvoegen')}</option>
              <option value="replace">{t('vervangen')}</option>
            </select>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
                e.target.value = '';
              }}
            />
          </div>
          {note && <p className={`note ${note.type}`}>{note.text}</p>}
          {confirmClear ? (
            <p className="confirm">
              {t('Alle bots worden gewist.')}{' '}
              <button
                className="btn btn-danger sm"
                onClick={() => {
                  store.clearAll();
                  setConfirmClear(false);
                  setNote({ type: 'ok', text: t('Alle bots zijn gewist.') });
                }}
              >
                {t('Wissen')}
              </button>{' '}
              <button className="btn sm" onClick={() => setConfirmClear(false)}>
                {t('Annuleer')}
              </button>
            </p>
          ) : (
            bots.length > 0 && (
              <button className="link" onClick={() => setConfirmClear(true)}>
                {t('Alle bots wissen')}
              </button>
            )
          )}
        </section>

        <section className="drawer-section">
          <h3>{t('Weergave')}</h3>
          <div className="seg-row">
            <span>{t('Thema')}</span>
            <Segmented
              value={settings.theme}
              onChange={(v) => setSetting('theme', v)}
              options={[
                { value: 'dark', label: t('Donker') },
                { value: 'light', label: t('Licht') },
                { value: 'system', label: t('Systeem') },
              ]}
            />
          </div>
          <div className="seg-row">
            <span>{t('Taal')}</span>
            <Segmented
              value={settings.language}
              onChange={(v) => setSetting('language', v)}
              options={[
                { value: 'nl', label: 'Nederlands' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.eyeTracking} onChange={(e) => setSetting('eyeTracking', e.target.checked)} />
            {t('Ogen volgen de cursor')}
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.showGrid} onChange={(e) => setSetting('showGrid', e.target.checked)} />
            {t('Achtergrondraster')}
          </label>
        </section>

        {brand && (
          <section className="drawer-section">
            <h3>{t('Uitloggen')}</h3>
            {confirmLogout ? (
              <>
                <p className="note">
                  {bots.length === 1
                    ? t('Je bedrijf en je bot worden van deze computer gewist.')
                    : t('Je bedrijf en alle {n} bots worden van deze computer gewist.', { n: bots.length })}{' '}
                  {t('Maak eerst een back-up als je ze later terug wilt.')}
                </p>
                <div className="row">
                  <button className="btn sm" onClick={store.exportJson}>
                    <Download width={14} height={14} /> {t('Back-up maken')}
                  </button>
                  <button className="btn btn-danger sm" onClick={onLogout}>
                    {t('Uitloggen')}
                  </button>
                  <button className="btn sm" onClick={() => setConfirmLogout(false)}>
                    {t('Annuleer')}
                  </button>
                </div>
              </>
            ) : (
              <div className="row">
                <button className="btn" onClick={() => setConfirmLogout(true)}>
                  <Logout width={16} height={16} /> {t('Uitloggen bij {name}', { name: brand.name })}
                </button>
              </div>
            )}
          </section>
        )}

        {bridge && <UpdateSection status={update.status} version={update.version} />}

        <p className="shortcuts mono">{t('↑ ↓ navigeren · / zoeken · F favoriet · E bewerken · N nieuw · G Grok-links')}</p>
      </motion.aside>
    </motion.div>
  );
}

/** Lijst van bots zonder eigen Grok-link, met een plakvak per bot. */
function LinkFixer({ bots, onSave }: { bots: Bot[]; onSave: (id: string, url: string) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const save = (id: string, value: string) => {
    const url = value.trim();
    if (!url) return;
    if (!hasBotLink(url)) {
      setErrors((e) => ({ ...e, [id]: true }));
      return;
    }
    setErrors((e) => ({ ...e, [id]: false }));
    onSave(id, url);
    setDrafts((d) => ({ ...d, [id]: '' }));
  };

  return (
    <section className="drawer-section">
      <button className="section-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h3>{t('Grok-links aanvullen')}</h3>
        <span className="mono muted">{t('{n} zonder link', { n: bots.length })}</span>
      </button>
      {open && (
        <>
          <p className="note muted small">
            {t('Open de bot in Grok, kopieer de link uit de adresbalk en plak hem hier. Hij wordt meteen bewaard.')}
          </p>
          <ul className="link-fixer">
            {bots.map((b) => (
              <li key={b.id}>
                <BotIcon bot={b} className="import-icon" />
                <span className="lf-name">{b.name}</span>
                <input
                  value={drafts[b.id] ?? ''}
                  placeholder="https://grok.com/…"
                  className={errors[b.id] ? 'invalid' : ''}
                  aria-label={t('Grok-link voor {name}', { name: b.name })}
                  onChange={(e) => setDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                  onPaste={(e) => {
                    const v = e.clipboardData.getData('text');
                    if (v) {
                      e.preventDefault();
                      save(b.id, v);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && save(b.id, drafts[b.id] ?? '')}
                  onBlur={(e) => save(b.id, e.target.value)}
                />
              </li>
            ))}
          </ul>
          {Object.values(errors).some(Boolean) && <p className="note err small">{t('Dat is geen link naar een Grok-bot.')}</p>}
        </>
      )}
    </section>
  );
}

function UpdateSection({ status, version }: { status: UpdateStatus; version: string | null }) {
  const t = useT();
  const text =
    status.state === 'checking'
      ? t('Zoeken naar updates…')
      : status.state === 'none'
        ? t('Je hebt de nieuwste versie.')
        : status.state === 'downloading'
          ? t('Versie {v} wordt gedownload… {p}%', { v: status.version ?? '', p: status.percent ?? 0 })
          : status.state === 'ready'
            ? t('Versie {v} is klaar om te installeren.', { v: status.version ?? '' })
            : status.state === 'available'
              ? t('Versie {v} is beschikbaar.', { v: status.version ?? '' })
              : status.state === 'error'
                ? t('Zoeken naar updates lukte niet. Controleer je internetverbinding.')
                : '';
  return (
    <section className="drawer-section">
      <h3>{t('Updates')}</h3>
      <p className="note muted">
        Bot Manager {version ?? ''} {text && `· ${text}`}
      </p>
      <div className="row">
        {status.state === 'ready' ? (
          <button className="btn btn-primary sm" onClick={() => bridge?.installUpdate()}>
            {t('Herstarten en installeren')}
          </button>
        ) : status.state === 'available' ? (
          <button className="btn btn-primary sm" onClick={() => bridge?.openDownloads()}>
            {t('Downloaden')}
          </button>
        ) : (
          <button className="btn sm" onClick={() => bridge?.checkForUpdates()} disabled={status.state === 'checking' || status.state === 'downloading'}>
            {t('Nu zoeken naar updates')}
          </button>
        )}
      </div>
    </section>
  );
}

function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
