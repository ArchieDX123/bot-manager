const { app, BrowserWindow, shell, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

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
    webPreferences: { contextIsolation: true, sandbox: true },
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

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.whenReady().then(createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
