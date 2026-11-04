import { useState, type CSSProperties, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { Bot, BotDraft } from '../types';
import { SHAPES, SHAPE_KEYS, SWATCHES } from '../shapes';
import { BotFace } from './BotFace';
import { Close } from '../icons';
import { readImage } from '../files';

const EMPTY: BotDraft = {
  name: '',
  role: '',
  team: '',
  description: '',
  color: SWATCHES[1],
  shape: 'circle',
  grokUrl: '',
  tags: [],
  avatar: undefined,
};

interface Props {
  bot?: Bot;
  teams: string[];
  onSave: (draft: BotDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function BotEditor({ bot, teams, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<BotDraft>(bot ? { ...bot } : EMPTY);
  const [tags, setTags] = useState((bot?.tags ?? []).join(', '));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const set = <K extends keyof BotDraft>(key: K, value: BotDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const urlOk = !draft.grokUrl || /^https?:\/\//i.test(draft.grokUrl.trim());
  const valid = draft.name.trim() && draft.team.trim() && urlOk;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      role: draft.role.trim(),
      team: draft.team.trim(),
      grokUrl: draft.grokUrl.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.form
        className="modal glass"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="modal-head">
          <h2>{bot ? `${bot.name} bewerken` : 'Nieuwe bot'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Sluiten">
            <Close />
          </button>
        </div>

        <div className="editor">
          <div className="editor-preview">
            <BotFace bot={{ ...draft, name: draft.name || 'Nieuwe bot' }} tracking size={180} />
            <div className="swatches">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch-btn ${draft.color === c ? 'is-on' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                  aria-label={`Kleur ${c}`}
                />
              ))}
              <label className="swatch-btn custom" title="Eigen kleur">
                <input type="color" value={draft.color} onChange={(e) => set('color', e.target.value)} aria-label="Eigen kleur" />
              </label>
            </div>
            <div className="shapes" role="radiogroup" aria-label="Vorm">
              {SHAPE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={draft.shape === k}
                  title={SHAPES[k].label}
                  className={`shape-btn ${draft.shape === k ? 'is-on' : ''}`}
                  onClick={() => set('shape', k)}
                >
                  <svg viewBox="0 0 200 200" width="22" height="22" aria-hidden="true">
                    <path d={SHAPES[k].path} fill={draft.color} />
                  </svg>
                </button>
              ))}
            </div>
            <label className="file-btn">
              {draft.avatar ? 'Andere afbeelding' : 'Eigen afbeelding (optioneel)'}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    setImgError(null);
                    set('avatar', await readImage(file));
                  } catch (err) {
                    setImgError(err instanceof Error ? err.message : 'Afbeelding kon niet geladen worden.');
                  }
                }}
              />
            </label>
            {imgError && <small className="err">{imgError}</small>}
            {draft.avatar && (
              <button type="button" className="link" onClick={() => set('avatar', undefined)}>
                Afbeelding verwijderen
              </button>
            )}
          </div>

          <div className="fields">
            <label>
              Naam
              <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="bv. Sales Manager" autoFocus />
            </label>
            <label>
              Taak
              <input value={draft.role} onChange={(e) => set('role', e.target.value)} placeholder="bv. Opvolging & offertes" />
            </label>
            <label>
              Afdeling / categorie
              <input value={draft.team} onChange={(e) => set('team', e.target.value)} list="teams" placeholder="bv. Verkoop" />
              <datalist id="teams">
                {teams.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              Grok-link
              <input
                value={draft.grokUrl}
                onChange={(e) => set('grokUrl', e.target.value)}
                placeholder="https://grok.com/…"
                className={urlOk ? '' : 'invalid'}
              />
              {!urlOk && <small className="err">Link moet starten met https://</small>}
            </label>
            <label className="span2">
              Beschrijving
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Waarvoor gebruik je deze assistent?"
              />
            </label>
            <label className="span2">
              Tags <small>(komma-gescheiden)</small>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="offertes, opvolging" />
            </label>
          </div>
        </div>

        <div className="modal-foot">
          {onDelete &&
            (confirmDelete ? (
              <span className="confirm">
                Zeker verwijderen?{' '}
                <button type="button" className="btn btn-danger" onClick={onDelete}>
                  Ja, verwijder
                </button>
                <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                  Nee
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost-danger" onClick={() => setConfirmDelete(true)}>
                Verwijderen
              </button>
            ))}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Annuleren
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid} style={{ '--bot': draft.color } as CSSProperties}>
            {bot ? 'Opslaan' : 'Toevoegen'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
