import { contextBridge, ipcRenderer } from 'electron/renderer'

/**
 * Type guard for exposing values in the renderer process
 * WARNING: This does not handle missing assignments. Ensure that all exposed APIs are defined.
 */
const exposeInRenderer = <K extends keyof Window & string>(key: K, value: Window[K]) => {
  contextBridge.exposeInMainWorld(key, value)
}

try {
  const platform = process.platform

  exposeInRenderer('api', {
    openFilePicker: async () => {
      await ipcRenderer.invoke('openFilePicker')
    },
    readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
  })
  exposeInRenderer('electron', true satisfies Window['electron'])
  exposeInRenderer('ipc', {
    addEventListener: (event, callback) => ipcRenderer.on(event, (_, params) => callback(params)),
  })
  exposeInRenderer(
    'os',
    platform === 'darwin' ? 'mac' : platform === 'win32' ? 'windows' : platform === 'linux' ? 'linux' : 'unknown',
  )
} catch (error) {
  console.error(error)
}
