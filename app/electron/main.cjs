const { app, BrowserWindow, shell, Menu, ipcMain, net } = require('electron');
const fs = require('fs');
const path = require('path');

const REPO = 'ArchieDX123/bot-manager';
const RELEASES_URL = 'https://archiedx123.github.io/bot-manager/';

// Gebruikers van de eerste versie ("Bushing Bot Manager") houden hun bots:
// bestaat de oude gegevensmap nog en de nieuwe niet, dan blijft de app de oude map gebruiken.
// (Electron maakt de nieuwe map soms al vroeg aan; daarom kijken we naar de opgeslagen gegevens zelf.)
const legacyData = path.join(app.getPath('appData'), 'bushing-bot-manager');
const hasStorage = (dir) => fs.existsSync(path.join(dir, 'Local Storage'));
if (hasStorage(legacyData) && !hasStorage(app.getPath('userData'))) {
  app.setPath('userData', legacyData);
}

// Eén venster tegelijk: een tweede start brengt het open venster naar voren.
if (!app.requestSingleInstanceLock()) app.quit();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0B0D10',
    title: 'Bot Manager',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // "Open in Grok" en andere links openen in de standaardbrowser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) {
      e.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
}

// ---------- Updates ----------
// Windows-installatie: electron-updater downloadt en installeert nieuwe versies.
// Mac en losse .exe: selfUpdate.cjs downloadt de nieuwe versie en vervangt de app
// bij het afsluiten. Lukt dat niet (bv. de app draait vanuit de .dmg), dan meldt de
// app de nieuwe versie met een downloadknop.
const autoInstall = app.isPackaged && process.platform === 'win32' && !process.env.PORTABLE_EXECUTABLE_DIR;
let updater = null;
const { createSelfUpdater } = require('./selfUpdate.cjs');
let self = null; // wordt aangemaakt zodra de app klaar is
let lastStatus = { state: 'idle' };

function send(status) {
  lastStatus = status;
  if (win && !win.isDestroyed()) win.webContents.send('update:status', status);
}

function newer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

function setupAutoUpdater() {
  if (updater || !autoInstall) return;
  updater = require('electron-updater').autoUpdater;
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on('checking-for-update', () => send({ state: 'checking' }));
  updater.on('update-not-available', () => send({ state: 'none', version: app.getVersion() }));
  updater.on('update-available', (info) => send({ state: 'downloading', version: info.version, percent: 0 }));
  updater.on('download-progress', (p) => send({ ...lastStatus, state: 'downloading', percent: Math.round(p.percent) }));
  updater.on('update-downloaded', (info) => send({ state: 'ready', version: info.version }));
  updater.on('error', (err) => send({ state: 'error', message: String(err && err.message ? err.message : err).slice(0, 200) }));
}

async function checkForUpdates() {
  if (!app.isPackaged) return send({ state: 'dev' });
  try {
    if (autoInstall) {
      setupAutoUpdater();
      await updater.checkForUpdates();
      return;
    }
    send({ state: 'checking' });
    const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'bot-manager-app' },
    });
    if (!res.ok) throw new Error(`GitHub antwoordde met ${res.status}`);
    const latest = String((await res.json()).tag_name || '').replace(/^v/, '');
    if (latest && newer(latest, app.getVersion())) {
      if (self && self.kind) await self.fetchUpdate(latest);
      else send({ state: 'available', version: latest });
    }
    else send({ state: 'none', version: app.getVersion() });
  } catch (err) {
    send({ state: 'error', message: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:check', () => checkForUpdates());
ipcMain.handle('update:install', () => {
  if (lastStatus.state !== 'ready') return;
  if (updater) updater.quitAndInstall();
  else if (self) self.restartAndInstall();
});
ipcMain.handle('update:open', () => shell.openExternal(RELEASES_URL));

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.whenReady().then(() => {
  self = createSelfUpdater({ repo: REPO, send });
  createWindow();
  // Kort na het opstarten en daarna elke 6 uur naar updates kijken.
  setTimeout(checkForUpdates, 8000);
  setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
// Klaarstaande update (Mac of losse .exe) bij gewoon afsluiten stil installeren.
app.on('before-quit', (e) => {
  if (!self || !self.isReady() || self.isInstalling()) return;
  // Even wachten met afsluiten tot het vervangen veilig gestart is.
  e.preventDefault();
  self.installOnQuit().finally(() => app.exit(0));
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
