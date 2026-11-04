// Brug tussen het venster en de app: alleen wat de interface nodig heeft voor updates.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('botManager', {
  version: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  openDownloads: () => ipcRenderer.invoke('update:open'),
  onUpdate: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
});
