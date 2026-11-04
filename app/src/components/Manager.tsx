import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Store, ImportMode } from '../store';
import { BrandForm } from './BrandForm';
import { ArrowDown, ArrowUp, Close, Download, Link, Pencil, Plus, Star, Trash, Upload } from '../icons';

interface Props {
  store: Store;
  onEdit: (id: string) => void;
  onNew: () => void;
  onGrokImport: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Zijpaneel om bots, bedrijfsgegevens, back-ups en weergave te beheren. */
export function Manager({ store, onEdit, onNew, onGrokImport, onSelect, onClose }: Props) {
  const { bots, brand, setBrand, settings, setSettings } = store;
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const importFile = async (file: File) => {
    try {
      const n = await store.importJson(file, mode);
      setNote({ type: 'ok', text: `${n} bots geïmporteerd (${mode === 'merge' ? 'samengevoegd' : 'vervangen'}).` });
    } catch (e) {
      setNote({ type: 'err', text: e instanceof Error ? e.message : 'Importeren mislukt.' });
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
        aria-label="Beheer"
      >
        <div className="modal-head">
          <h2>
            Beheer <span className="mono muted">{bots.length} bots</span>
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sluiten">
            <Close />
          </button>
        </div>

        <div className="row two">
          <button className="btn btn-primary" onClick={onGrokImport}>
            <Link width={16} height={16} /> Uit Grok toevoegen
          </button>
          <button className="btn" onClick={onNew}>
            <Plus width={16} height={16} /> Zelf maken
          </button>
        </div>

        {bots.length === 0 && <p className="note muted">Nog geen bots. Plak je Grok-links om te beginnen.</p>}
        <ul className="manage-list">
          {bots.map((b, i) => (
            <li key={b.id} className="manage-row">
              <span className="swatch" style={{ background: b.color }} />
              <button className="mr-main" onClick={() => onSelect(b.id)}>
                <span className="mr-name">
                  {b.name} {b.favorite && <Star width={12} height={12} filled className="pi-star" />}
                </span>
                <span className="mr-sub">
                  {[b.role, b.team].filter(Boolean).join(' · ')}
                  {!b.grokUrl && ' · geen Grok-link'}
                </span>
              </button>
              <div className="mr-actions">
                <button className="icon-btn sm" onClick={() => store.moveBot(b.id, -1)} disabled={i === 0} title="Omhoog" aria-label="Omhoog">
                  <ArrowUp width={15} height={15} />
                </button>
                <button
                  className="icon-btn sm"
                  onClick={() => store.moveBot(b.id, 1)}
                  disabled={i === bots.length - 1}
                  title="Omlaag"
                  aria-label="Omlaag"
                >
                  <ArrowDown width={15} height={15} />
                </button>
                <button className="icon-btn sm" onClick={() => onEdit(b.id)} title="Bewerken" aria-label="Bewerken">
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
                    Bevestig
                  </button>
                ) : (
                  <button className="icon-btn sm" onClick={() => setConfirmId(b.id)} title="Verwijderen" aria-label="Verwijderen">
                    <Trash width={15} height={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {brand && (
          <section className="drawer-section">
            <h3>Bedrijf</h3>
            <BrandForm value={brand} onChange={(b) => setBrand({ ...b, name: b.name || brand.name })} />
          </section>
        )}

        <section className="drawer-section">
          <h3>Back-up</h3>
          <div className="row">
            <button className="btn" onClick={store.exportJson}>
              <Download width={16} height={16} /> Exporteren
            </button>
            <button className="btn" onClick={() => fileInput.current?.click()}>
              <Upload width={16} height={16} /> Importeren
            </button>
            <select value={mode} onChange={(e) => setMode(e.target.value as ImportMode)} aria-label="Importmodus">
              <option value="merge">samenvoegen</option>
              <option value="replace">vervangen</option>
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
              Alle bots worden gewist.{' '}
              <button
                className="btn btn-danger sm"
                onClick={() => {
                  store.clearAll();
                  setConfirmClear(false);
                  setNote({ type: 'ok', text: 'Alle bots zijn gewist.' });
                }}
              >
                Wissen
              </button>{' '}
              <button className="btn sm" onClick={() => setConfirmClear(false)}>
                Annuleer
              </button>
            </p>
          ) : (
            bots.length > 0 && (
              <button className="link" onClick={() => setConfirmClear(true)}>
                Alle bots wissen
              </button>
            )
          )}
        </section>

        <section className="drawer-section">
          <h3>Weergave</h3>
          <label className="toggle">
            <input type="checkbox" checked={settings.eyeTracking} onChange={(e) => setSettings((s) => ({ ...s, eyeTracking: e.target.checked }))} />
            Ogen volgen de cursor
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.showGrid} onChange={(e) => setSettings((s) => ({ ...s, showGrid: e.target.checked }))} />
            Achtergrondraster
          </label>
        </section>

        <p className="shortcuts mono">↑ ↓ navigeren · / zoeken · F favoriet · E bewerken · N nieuw · G Grok-links</p>
      </motion.aside>
    </motion.div>
  );
}
