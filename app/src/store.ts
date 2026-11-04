import { useCallback, useEffect, useState } from 'react';
import type { Bot, BotDraft, Brand, Settings, ShapeKey } from './types';
import { SHAPE_KEYS } from './shapes';

const KEYS = {
  bots: 'botmanager.bots.v1',
  brand: 'botmanager.brand.v1',
  settings: 'botmanager.settings.v1',
  active: 'botmanager.active.v1',
};

// Sleutels van de eerste versie (toen de app nog alleen voor Bushing was).
// Bestaande gegevens worden bij de eerste start automatisch overgenomen.
const LEGACY = {
  bots: 'bushing.bots.v2',
  settings: 'bushing.settings.v1',
  active: 'bushing.active.v1',
};

export const DEFAULT_ACCENT = '#E8552B';
const DEFAULT_SETTINGS: Settings = { showGrid: true, eyeTracking: true };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Opslag vol of geblokkeerd: de app blijft werken, alleen zonder bewaren.
  }
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Neemt gegevens van de oude Bushing-versie over, één keer. */
function migrateLegacy() {
  try {
    if (localStorage.getItem(KEYS.bots) !== null) return;
    const oldBots = localStorage.getItem(LEGACY.bots);
    if (!oldBots) return;
    const oldSettings = read<{ logo?: string } & Partial<Settings>>(LEGACY.settings, {});
    localStorage.setItem(KEYS.bots, oldBots);
    write(KEYS.brand, { name: 'Bushing', logo: oldSettings.logo, accent: DEFAULT_ACCENT } satisfies Brand);
    write(KEYS.settings, {
      showGrid: oldSettings.showGrid ?? true,
      eyeTracking: oldSettings.eyeTracking ?? true,
    } satisfies Settings);
    const active = localStorage.getItem(LEGACY.active);
    if (active) localStorage.setItem(KEYS.active, active);
  } catch {
    /* geen toegang tot opslag */
  }
}

/** Controleert en vult een bot uit een importbestand aan. */
export function normalizeBot(raw: unknown): Bot | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Partial<Bot>;
  if (typeof b.name !== 'string' || !b.name.trim()) return null;
  const now = Date.now();
  return {
    id: typeof b.id === 'string' && b.id ? b.id : newId(),
    name: b.name.trim(),
    role: typeof b.role === 'string' ? b.role : '',
    team: typeof b.team === 'string' && b.team.trim() ? b.team : 'Overig',
    description: typeof b.description === 'string' ? b.description : '',
    tags: Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === 'string') : [],
    color: typeof b.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(b.color) ? b.color : '#22C267',
    shape: SHAPE_KEYS.includes(b.shape as ShapeKey) ? (b.shape as ShapeKey) : 'circle',
    grokUrl: typeof b.grokUrl === 'string' && /^https?:\/\//i.test(b.grokUrl) ? b.grokUrl : '',
    avatar: typeof b.avatar === 'string' && b.avatar.startsWith('data:image/') ? b.avatar : undefined,
    favorite: b.favorite === true,
    createdAt: typeof b.createdAt === 'number' ? b.createdAt : now,
    updatedAt: now,
  };
}

export type ImportMode = 'merge' | 'replace';

export function useStore() {
  const [bots, setBots] = useState<Bot[]>(() => {
    migrateLegacy();
    return read<Bot[]>(KEYS.bots, []);
  });
  const [brand, setBrand] = useState<Brand | null>(() => read<Brand | null>(KEYS.brand, null));
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...read<Partial<Settings>>(KEYS.settings, {}),
  }));
  const [activeId, setActiveId] = useState<string | null>(() => read<string | null>(KEYS.active, null));

  useEffect(() => write(KEYS.bots, bots), [bots]);
  useEffect(() => write(KEYS.brand, brand), [brand]);
  useEffect(() => write(KEYS.settings, settings), [settings]);
  useEffect(() => write(KEYS.active, activeId), [activeId]);

  const addBots = useCallback((drafts: BotDraft[]) => {
    const now = Date.now();
    const created = drafts.map((d, i) => ({
      favorite: false,
      ...d,
      id: newId(),
      createdAt: now + i,
      updatedAt: now + i,
    }));
    setBots((list) => [...list, ...created]);
    return created.map((b) => b.id);
  }, []);

  const updateBot = useCallback((id: string, patch: Partial<Bot>) => {
    setBots((list) => list.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)));
  }, []);

  const removeBot = useCallback((id: string) => {
    setBots((list) => list.filter((b) => b.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setBots((list) => list.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b)));
  }, []);

  const moveBot = useCallback((id: string, delta: number) => {
    setBots((list) => {
      const from = list.findIndex((b) => b.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const exportJson = useCallback(() => {
    const payload = { app: 'bot-manager', version: 2, exportedAt: new Date().toISOString(), brand, bots };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-manager-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bots, brand]);

  /** Leest een export van deze app of van de oude Bushing-versie. */
  const importJson = useCallback(async (file: File, mode: ImportMode) => {
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error('Dit is geen geldig JSON-bestand.');
    }
    const list = Array.isArray(data) ? data : (data as { bots?: unknown })?.bots;
    if (!Array.isArray(list)) throw new Error('Geen bots gevonden in dit bestand.');
    const valid = list.map(normalizeBot).filter((b): b is Bot => b !== null);
    if (!valid.length) throw new Error('Het bestand bevat geen geldige bots.');
    setBots((current) => {
      if (mode === 'replace') return valid;
      const byId = new Map(current.map((b) => [b.id, b]));
      valid.forEach((b) => byId.set(b.id, b));
      return [...byId.values()];
    });
    return valid.length;
  }, []);

  const clearAll = useCallback(() => {
    setBots([]);
    setActiveId(null);
  }, []);

  /** Uitloggen: bedrijf en bots van deze computer wissen; daarna volgt het welkomstscherm. */
  const logout = useCallback(() => {
    setBots([]);
    setActiveId(null);
    setBrand(null);
  }, []);

  return {
    bots,
    brand,
    setBrand,
    settings,
    setSettings,
    activeId,
    setActiveId,
    addBots,
    updateBot,
    removeBot,
    toggleFavorite,
    moveBot,
    exportJson,
    importJson,
    clearAll,
    logout,
  };
}

export type Store = ReturnType<typeof useStore>;
