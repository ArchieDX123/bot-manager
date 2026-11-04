import { useState, type CSSProperties, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { Bot, BotDraft } from '../types';
import { SHAPES, SHAPE_KEYS, SWATCHES } from '../shapes';
import { BotFace } from './BotFace';
import { Close } from '../icons';
import { readImage } from '../files';
import { useT } from '../i18n';

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
  const t = useT();
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
          <h2>{bot ? t('{name} bewerken', { name: bot.name }) : t('Nieuwe bot')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('Sluiten')}>
            <Close />
          </button>
        </div>

        <div className="editor">
          <div className="editor-preview">
            <BotFace bot={{ ...draft, name: draft.name || t('Nieuwe bot') }} tracking size={180} />
            <div className="swatches">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch-btn ${draft.color === c ? 'is-on' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                  aria-label={`${t('Kleur')} ${c}`}
                />
              ))}
              <label className="swatch-btn custom" title={t('Eigen kleur')}>
                <input type="color" value={draft.color} onChange={(e) => set('color', e.target.value)} aria-label={t('Eigen kleur')} />
              </label>
            </div>
            <div className="shapes" role="radiogroup" aria-label={t('Vorm')}>
              {SHAPE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={draft.shape === k}
                  title={t(SHAPES[k].label)}
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
              {draft.avatar ? t('Andere afbeelding') : t('Eigen afbeelding (optioneel)')}
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
                    setImgError(t(err instanceof Error ? err.message : 'Afbeelding kon niet geladen worden.'));
                  }
                }}
              />
            </label>
            {imgError && <small className="err">{imgError}</small>}
            {draft.avatar && (
              <button type="button" className="link" onClick={() => set('avatar', undefined)}>
                {t('Afbeelding verwijderen')}
              </button>
            )}
          </div>

          <div className="fields">
            <label>
              {t('Naam')}
              <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder={t('bv. Sales Manager')} autoFocus />
            </label>
            <label>
              {t('Taak')}
              <input value={draft.role} onChange={(e) => set('role', e.target.value)} placeholder={t('bv. Opvolging & offertes')} />
            </label>
            <label>
              {t('Afdeling / categorie')}
              <input value={draft.team} onChange={(e) => set('team', e.target.value)} list="teams" placeholder={t('bv. Verkoop')} />
              <datalist id="teams">
                {teams.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              {t('Grok-link')}
              <input
                value={draft.grokUrl}
                onChange={(e) => set('grokUrl', e.target.value)}
                placeholder="https://grok.com/…"
                className={urlOk ? '' : 'invalid'}
              />
              {!urlOk && <small className="err">{t('Link moet starten met https://')}</small>}
            </label>
            <label className="span2">
              {t('Beschrijving')}
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={t('Waarvoor gebruik je deze assistent?')}
              />
            </label>
            <label className="span2">
              {t('Tags')} <small>{t('(komma-gescheiden)')}</small>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t('offertes, opvolging')} />
            </label>
          </div>
        </div>

        <div className="modal-foot">
          {onDelete &&
            (confirmDelete ? (
              <span className="confirm">
                {t('Zeker verwijderen?')}{' '}
                <button type="button" className="btn btn-danger" onClick={onDelete}>
                  {t('Ja, verwijder')}
                </button>
                <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                  {t('Nee')}
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost-danger" onClick={() => setConfirmDelete(true)}>
                {t('Verwijderen')}
              </button>
            ))}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            {t('Annuleren')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid} style={{ '--bot': draft.color } as CSSProperties}>
            {bot ? t('Opslaan') : t('Toevoegen')}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
