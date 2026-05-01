import { contextBridge, ipcRenderer, webUtils } from 'electron/renderer'

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
      return await ipcRenderer.invoke('openFilePicker')
    },
    readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
    getExchangeToken: () => ipcRenderer.invoke('getExchangeToken'),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    customFetch: (request) => ipcRenderer.invoke('customFetch', request),
    customFetchStream: ({ streamId, callbacks }) => {
      // Each listener is created in preload-side closure so we can remove the
      // exact reference later — contextBridge proxies prevent the renderer from
      // holding references to the actual listener functions.
      const onData = (_: Electron.IpcRendererEvent, data: { streamId: string; chunk: ArrayBuffer }) => {
        if (data.streamId === streamId) {
          callbacks.onData(data.chunk)
        }
      }
      const onEnd = (_: Electron.IpcRendererEvent, data: { streamId: string }) => {
        if (data.streamId === streamId) {
          cleanup()
          callbacks.onEnd()
        }
      }
      const onError = (_: Electron.IpcRendererEvent, data: { streamId: string; message: string }) => {
        if (data.streamId === streamId) {
          cleanup()
          callbacks.onError(data.message)
        }
      }
      const cleanup = () => {
        ipcRenderer.removeListener('customFetch:data', onData)
        ipcRenderer.removeListener('customFetch:end', onEnd)
        ipcRenderer.removeListener('customFetch:error', onError)
      }
      // All three events must use `on` (not `once`): Node's EventEmitter fires
      // every registered `once` listener when the event is emitted, so if
      // multiple streams are in flight, the first one to end would consume
      // the `once` listeners of all other streams too.  Each listener filters
      // by `streamId` and manually removes itself via `cleanup()` when its
      // stream terminates.
      ipcRenderer.on('customFetch:data', onData)
      ipcRenderer.on('customFetch:end', onEnd)
      ipcRenderer.on('customFetch:error', onError)
    },
    customFetchAbort: (streamId) => ipcRenderer.send('customFetchAbort', streamId),
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
