import type { IpcFetchRequest, IpcFetchResponse } from './helpers/custom-fetch/types'

declare global {
  interface Window {
    electron: boolean
    os: 'mac' | 'windows' | 'linux' | 'unknown'
    /**
     * IPC events that we explicitly expose to the browser. This is only a small
     * subset of the IPC events where browser handlers are required.
     *
     * WARNING: These must only contain safe payloads (primitives and clones). We must not
     * expose node contexts to the browser
     *
     * Generally these should only be used where an event is triggered in node but must be handled
     * by the browser. Otherwise it is better to expose an API below that can be triggered by the browser
     * and is inclusive of its return.
     */
    ipc: {
      addEventListener: AddIpcListener
    }
    /**
     * Exposed functions that are triggered from the browser context but run in the main node process
     * These are defined in the preload function and can have a return value that the browser can await
     *
     * WARNING: These must only contain safe payloads (primitives and clones). We must not
     *          expose node contexts to the browser
     */
    api: {
      /** Trigger the file picker dialog */
      openFilePicker: () => Promise<string | undefined>
      /** Read a file string using to the renderer process */
      readFile: (f: string) => Promise<string | undefined>
      /** Request an exchange token from the auth service */
      getExchangeToken: () => Promise<{
        accessToken: string
        refreshToken: string
      } | null>
      /** Get the file system path for a File object */
      getPathForFile: (file: File) => string
      /** Execute a fetch request via undici in the main process (bypasses CORS/Chromium) */
      customFetch: (request: IpcFetchRequest) => Promise<IpcFetchResponse>
      /**
       * Subscribe to the incremental body stream for a streaming fetch identified
       * by `streamId`.  Callbacks fire for each chunk, on completion, and on error.
       * Listeners are cleaned up automatically when the stream ends or errors.
       */
      customFetchStream: (params: {
        streamId: string
        callbacks: {
          onData: (chunk: ArrayBuffer) => void
          onEnd: () => void
          onError: (message: string) => void
        }
      }) => void
      /** Cancel an in-progress fetch by its abort ID, releasing the underlying connection. */
      customFetchAbort: (abortId: string) => void
    }
  }
}

/** Events that occur in the Node context and must be propagated to the browser */
export type BrowserIpcEvents = {
  /**
   * Import file event is used to handle files that are dropped into the app
   * These files trigger node based actions that must be propagated to the browser
   */
  'import-file': (filePath: string) => Promise<void> | void
  /** A chunk of body data for an in-progress streaming fetch. */
  'customFetch:data': (data: { streamId: string; chunk: ArrayBuffer }) => void
  /** Signals that all body chunks have been delivered for a streaming fetch. */
  'customFetch:end': (data: { streamId: string }) => void
  /** Signals that a streaming fetch failed after the headers were already sent. */
  'customFetch:error': (data: { streamId: string; message: string }) => void
}

/** Union of possible IPC events we will expose to the rendered function */
type AddIpcListener = <K extends keyof BrowserIpcEvents>(name: K, callback: BrowserIpcEvents[K]) => void
