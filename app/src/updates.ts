import { useEffect, useState } from 'react';

export interface UpdateStatus {
  state: 'idle' | 'dev' | 'checking' | 'none' | 'available' | 'downloading' | 'ready' | 'error';
  version?: string;
  percent?: number;
  message?: string;
}

interface Bridge {
  version: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  openDownloads: () => Promise<void>;
  onUpdate: (cb: (s: UpdateStatus) => void) => () => void;
}

/** Alleen aanwezig in de desktopapp (niet in de browser). */
export const bridge: Bridge | undefined = (globalThis as { botManager?: Bridge }).botManager;

export function useUpdates() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    if (!bridge) return;
    bridge.version().then(setVersion).catch(() => {});
    return bridge.onUpdate(setStatus);
  }, []);
  return { status, version, available: !!bridge };
}
