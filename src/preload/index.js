import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('worklaunch:get-config'),
  saveConfig: (config) => ipcRenderer.invoke('worklaunch:save-config', config),
  launchAll: () => ipcRenderer.invoke('worklaunch:launch-all'),
  getAutoStart: () => ipcRenderer.invoke('worklaunch:get-autostart'),
  setAutoStart: (enabled) => ipcRenderer.invoke('worklaunch:set-autostart', enabled),
  getVersion: () => ipcRenderer.invoke('worklaunch:get-version'),
  onLaunchAll: (callback) => {
    ipcRenderer.on('trigger-launch-all', callback)
    return () => ipcRenderer.removeListener('trigger-launch-all', callback)
  }
})
