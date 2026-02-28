import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'

import YamlWorker from './yaml.worker?worker'

/**
 * This function ensures that the Monaco Editor's global environment is configured
 * to provide the correct web worker for each language (json, yaml, or the default editor).
 */
export const ensureMonacoEnvironment = (): void => {
  const environment = {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json':
          return new JsonWorker()
        case 'yaml':
          return new YamlWorker()
        default:
          return new EditorWorker()
      }
    },
  }

  // Set the MonacoEnvironment on the global scope if it hasn't already been set
  globalThis.MonacoEnvironment ??= {
    getWorker: environment.getWorker,
  }
}
