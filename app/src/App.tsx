import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore, DEFAULT_ACCENT } from './store';
import type { BotDraft } from './types';
import { Background, Header, Rail } from './components/Layout';
import { Stage } from './components/Stage';
import { Info } from './components/Info';
import { SearchPalette } from './components/SearchPalette';
import { BotEditor } from './components/BotEditor';
import { Manager } from './components/Manager';
import { GrokImport } from './components/GrokImport';
import { Onboarding } from './components/Onboarding';
import { Link, Plus } from './icons';

type Editing = { mode: 'new' } | { mode: 'edit'; id: string } | null;

export default function App() {
  const store = useStore();
  const { bots, brand, settings, activeId, setActiveId } = store;

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [direction, setDirection] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

  const visible = useMemo(() => (favoritesOnly ? bots.filter((b) => b.favorite) : bots), [bots, favoritesOnly]);
  const index = Math.max(0, visible.findIndex((b) => b.id === activeId));
  const active = visible[index];

  // Houd de gekozen bot geldig, ook na verwijderen of filteren.
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId, setActiveId]);

  const step = useCallback(
    (delta: number) => {
      const next = visible[index + delta];
      if (!next) return;
      setDirection(delta);
      setActiveId(next.id);
    },
    [visible, index, setActiveId],
  );

  const select = useCallback(
    (id: string) => {
      const to = bots.findIndex((b) => b.id === id);
      const from = bots.findIndex((b) => b.id === activeId);
      if (favoritesOnly && !bots[to]?.favorite) setFavoritesOnly(false);
      setDirection(to >= from ? 1 : -1);
      setActiveId(id);
      setSearchOpen(false);
    },
    [bots, activeId, favoritesOnly, setActiveId],
  );

  const addAndShow = useCallback(
    (drafts: BotDraft[]) => {
      const ids = store.addBots(drafts);
      if (ids.length) {
        setDirection(1);
        setFavoritesOnly(false);
        setActiveId(ids[0]);
      }
    },
    [store, setActiveId],
  );

  const overlayOpen = searchOpen || managerOpen || importOpen || editing !== null || !brand;

  // Toetsenbord
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) setEditing(null);
        else if (importOpen) setImportOpen(false);
        else if (searchOpen) setSearchOpen(false);
        else setManagerOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || overlayOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        step(-1);
      } else if (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'f' && active) {
          e.preventDefault();
          store.toggleFavorite(active.id);
        } else if (k === 'e' && active) {
          e.preventDefault();
          setEditing({ mode: 'edit', id: active.id });
        } else if (k === 'n') {
          e.preventDefault();
          setEditing({ mode: 'new' });
        } else if (k === 'g') {
          e.preventDefault();
          setImportOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, overlayOpen, active, store, editing, importOpen, searchOpen]);

  // Muiswiel: één bot per scrollbeweging.
  const lastWheel = useRef(0);
  const onWheel = (e: WheelEvent) => {
    if (overlayOpen || Math.abs(e.deltaY) < 18) return;
    const now = performance.now();
    if (now - lastWheel.current < 650) return;
    lastWheel.current = now;
    step(e.deltaY > 0 ? 1 : -1);
  };

  const teams = useMemo(() => [...new Set(bots.map((b) => b.team))], [bots]);
  const teamIndex = useMemo(() => {
    if (!active) return { pos: 0, total: 0 };
    const same = visible.filter((b) => b.team === active.team);
    return { pos: same.findIndex((b) => b.id === active.id) + 1, total: same.length };
  }, [visible, active]);
  const editingBot = editing?.mode === 'edit' ? bots.find((b) => b.id === editing.id) : undefined;
  const accent = active?.color ?? brand?.accent ?? DEFAULT_ACCENT;

  useEffect(() => {
    document.title = brand ? `Bot Manager · ${brand.name}` : 'Bot Manager';
  }, [brand]);

  return (
    <div className="app" onWheel={onWheel} style={{ '--accent': accent } as CSSProperties}>
      <Background color={accent} showGrid={settings.showGrid} />
      <Header
        brand={brand}
        favoritesOnly={favoritesOnly}
        favoriteCount={bots.filter((b) => b.favorite).length}
        onToggleFavorites={() => setFavoritesOnly((v) => !v)}
        onSearch={() => setSearchOpen(true)}
        onManage={() => setManagerOpen(true)}
      />

      {!brand ? (
        <Onboarding onDone={store.setBrand} />
      ) : active ? (
        <main className="main">
          <Rail bots={visible} activeId={active.id} onSelect={select} />
          <Stage
            bot={active}
            direction={direction}
            tracking={settings.eyeTracking && !overlayOpen}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            canPrev={index > 0}
            canNext={index < visible.length - 1}
            teamIndex={teamIndex}
          />
          <Info
            bot={active}
            index={index}
            total={visible.length}
            direction={direction}
            onFavorite={() => store.toggleFavorite(active.id)}
            onEdit={() => setEditing({ mode: 'edit', id: active.id })}
          />
        </main>
      ) : (
        <main className="main empty-state">
          <div>
            <h1>{favoritesOnly ? 'Nog geen favorieten' : 'Nog geen bots'}</h1>
            <p>
              {favoritesOnly
                ? 'Markeer een bot met de ster of druk op F.'
                : 'Plak de links van je Grok-bots, dan staan ze meteen in je overzicht.'}
            </p>
            {favoritesOnly ? (
              <button className="btn" onClick={() => setFavoritesOnly(false)}>
                Toon alle bots
              </button>
            ) : (
              <div className="row center">
                <button className="btn btn-primary" onClick={() => setImportOpen(true)}>
                  <Link width={16} height={16} /> Bots uit Grok toevoegen
                </button>
                <button className="btn" onClick={() => setEditing({ mode: 'new' })}>
                  <Plus width={16} height={16} /> Zelf een bot maken
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      <AnimatePresence>
        {searchOpen && <SearchPalette key="search" bots={bots} onSelect={select} onClose={() => setSearchOpen(false)} />}
        {managerOpen && !editing && !importOpen && (
          <Manager
            key="manager"
            store={store}
            onEdit={(id) => setEditing({ mode: 'edit', id })}
            onNew={() => setEditing({ mode: 'new' })}
            onGrokImport={() => setImportOpen(true)}
            onSelect={(id) => {
              select(id);
              setManagerOpen(false);
            }}
            onLogout={() => {
              store.logout();
              setFavoritesOnly(false);
              setManagerOpen(false);
            }}
            onClose={() => setManagerOpen(false)}
          />
        )}
        {importOpen && (
          <GrokImport
            key="import"
            existing={bots}
            teams={teams}
            onClose={() => setImportOpen(false)}
            onAdd={(drafts) => {
              addAndShow(drafts);
              setImportOpen(false);
              setManagerOpen(false);
            }}
          />
        )}
        {editing && (
          <BotEditor
            key={editing.mode === 'edit' ? editing.id : 'new'}
            bot={editingBot}
            teams={teams}
            onClose={() => setEditing(null)}
            onSave={(draft) => {
              if (editing.mode === 'edit' && editingBot) store.updateBot(editingBot.id, draft);
              else addAndShow([draft]);
              setEditing(null);
            }}
            onDelete={
              editingBot
                ? () => {
                    store.removeBot(editingBot.id);
                    setEditing(null);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
