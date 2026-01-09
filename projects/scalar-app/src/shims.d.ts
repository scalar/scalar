export type BrowserIpcEvents = {
  'import-file': (file: string) => Promise<void> | void
}

/** Union of possible IPC events we will expose to the rendered function */
type AddIpcListener = <K extends keyof BrowserIpcEvents>(name: K, callback: BrowserIpcEvents[K]) => void

declare global {
  interface Window {
    electron: boolean
    os: 'mac' | 'windows' | 'linux' | 'unknown'
    ipc: {
      addEventListener: AddIpcListener
    }
    api: {
      /** Trigger the file picker dialog */
      openFilePicker: () => Promise<void>
      /** Read a file string using to the renderer process */
      readFile: (f: string) => Promise<string | undefined>
    }
  }
}

export {}
