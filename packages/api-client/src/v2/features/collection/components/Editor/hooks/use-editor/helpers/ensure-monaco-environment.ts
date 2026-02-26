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

  window.MonacoEnvironment ??= {
    getWorker: environment.getWorker,
  }
}
