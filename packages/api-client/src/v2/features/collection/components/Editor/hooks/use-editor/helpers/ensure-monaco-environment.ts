import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'

export const ensureMonacoEnvironment = (): void => {
  const environment = {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json':
          return new JsonWorker()
        default:
          return new EditorWorker()
      }
    },
  }

  // Monaco reads `globalThis.MonacoEnvironment` to decide how to spawn workers.
  // If another part of the app sets a broken MonacoEnvironment first, workers can fail
  // (which breaks JSON validation/autocomplete). Always ensure a working `getWorker`,
  // while preserving any other existing MonacoEnvironment fields.
  const globalScope = globalThis as typeof globalThis & {
    MonacoEnvironment?: Record<string, unknown> & {
      getWorker?: (workerId: string, label: string) => Worker
    }
  }

  globalScope.MonacoEnvironment = {
    ...(globalScope.MonacoEnvironment ?? {}),
    getWorker: environment.getWorker,
  }
}
