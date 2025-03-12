import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron/renderer'

// Custom APIs for renderer
const api = {
  openFile: () => ipcRenderer.invoke('openFile'),
  readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
}

declare global {
  interface Window {
    electron: typeof electronAPI
    api: typeof api
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
