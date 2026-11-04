import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Bot, BotDraft } from '../types';
import { SHAPE_KEYS, SWATCHES } from '../shapes';
import { normalizeUrl, parseGrokLinks } from '../grok';
import { BotIcon } from './BotFace';
import { Close } from '../icons';

interface Props {
  existing: Bot[];
  teams: string[];
  onAdd: (drafts: BotDraft[]) => void;
  onClose: () => void;
}

interface Row {
  url: string;
  name: string;
  duplicate: boolean;
}

const EXAMPLE = `Sales Manager - https://grok.com/bot/…
Social Media Manager - https://grok.com/bot/…`;

/** Meerdere Grok-links tegelijk plakken en er bots van maken. */
export function GrokImport({ existing, teams, onAdd, onClose }: Props) {
  const [text, setText] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [team, setTeam] = useState('Grok-bots');
  const area = useRef<HTMLTextAreaElement>(null);
  // Na de openingsanimatie meteen klaar om te plakken.
  useEffect(() => {
    const t = window.setTimeout(() => area.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);

  const known = useMemo(() => new Set(existing.map((b) => normalizeUrl(b.grokUrl)).filter(Boolean)), [existing]);
  const { links, ignored } = useMemo(() => parseGrokLinks(text), [text]);
  const rows: Row[] = links.map((l) => ({
    url: l.url,
    name: names[l.url] ?? l.name,
    duplicate: known.has(normalizeUrl(l.url)),
  }));
  const fresh = rows.filter((r) => !r.duplicate);

  const style = (i: number) => {
    const n = existing.length + i;
    return { color: SWATCHES[n % SWATCHES.length], shape: SHAPE_KEYS[(n * 4 + 1) % SHAPE_KEYS.length] };
  };

  const submit = () => {
    if (!fresh.length) return;
    const t = team.trim() || 'Grok-bots';
    onAdd(
      fresh.map((r, i) => ({
        name: r.name.trim() || `Grok-bot ${existing.length + i + 1}`,
        role: '',
        team: t,
        description: '',
        tags: [],
        grokUrl: r.url,
        ...style(i),
      })),
    );
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div
        className="modal glass import"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-label="Bots uit Grok toevoegen"
      >
        <div className="modal-head">
          <h2>Bots uit Grok toevoegen</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Sluiten">
            <Close />
          </button>
        </div>

        <ol className="steps">
          <li>Open je bot in Grok en kopieer de link uit de adresbalk (of via Delen).</li>
          <li>Plak hieronder één of meer links. Zet er gerust de naam voor: <span className="mono">Naam - link</span></li>
          <li>Controleer de namen en klik op toevoegen. Taak en beschrijving vul je later aan.</li>
        </ol>

        <div className="fields single">
          <label>
            Links
            <textarea
              ref={area}
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE}
              spellCheck={false}
              aria-label="Grok-links"
            />
          </label>
        </div>

        {rows.length > 0 && (
          <>
            <ul className="import-list">
              {rows.map((r) => {
                const freshIndex = fresh.indexOf(r);
                return (
                  <li key={r.url} className={r.duplicate ? 'is-dup' : ''}>
                    <BotIcon bot={r.duplicate ? { color: '#555', shape: 'circle' } : style(freshIndex)} className="import-icon" />
                    <input
                      value={r.name}
                      onChange={(e) => setNames((n) => ({ ...n, [r.url]: e.target.value }))}
                      placeholder={r.duplicate ? '' : `Grok-bot ${existing.length + freshIndex + 1}`}
                      aria-label="Naam van de bot"
                      disabled={r.duplicate}
                    />
                    <span className="import-url mono" title={r.url}>
                      {r.duplicate ? 'staat al in je lijst' : r.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="fields single">
              <label>
                Afdeling voor deze bots
                <input value={team} onChange={(e) => setTeam(e.target.value)} list="import-teams" />
                <datalist id="import-teams">
                  {teams.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>
            </div>
          </>
        )}
        {text.trim() && !rows.length && <p className="note err">Geen Grok-links gevonden. Links beginnen met https://grok.com/…</p>}
        {ignored.length > 0 && (
          <p className="note muted">
            {ignored.length} {ignored.length === 1 ? 'link is' : 'links zijn'} overgeslagen omdat ze niet van Grok zijn.
          </p>
        )}

        <p className="note muted small">
          Grok biedt nog geen officiële manier om al je bots automatisch op te halen. Daarom werkt dit met links.
        </p>

        <div className="modal-foot">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Annuleren
          </button>
          <button type="button" className="btn btn-primary" disabled={!fresh.length} onClick={submit}>
            {fresh.length === 1 ? '1 bot toevoegen' : `${fresh.length} bots toevoegen`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
