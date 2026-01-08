import { type BrowserWindow, ipcMain } from 'electron/main'

import type { BrowserIpcEvents } from '../../shims'

/** Type guard to ensure that handlers match the event signature */
export const onIpcEvent = <K extends keyof Window['api'] & string>(key: K, handler: Window['api'][K]) => {
  ipcMain.handle(key, (_, params) => handler(params))
}

/** Type guard to emit an event back to the renderer process with the correct params */
export const emitIpcEvent = <K extends keyof BrowserIpcEvents & string>(
  key: K,
  params: Parameters<BrowserIpcEvents[K]>[0],
  appWindow: BrowserWindow,
) => {
  appWindow.webContents.send(key, params)
}
