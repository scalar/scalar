import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

import YamlWorker from './yaml.worker?worker'

/**
 * This function ensures that the Monaco Editor's global environment is configured
 * to provide the correct web worker for each language (json, yaml, or the default editor).
 */
export const ensureMonacoEnvironment = (): void => {
  // Set the MonacoEnvironment on the global scope if it hasn't already been set
  globalThis.MonacoEnvironment ??= {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json':
          return new JsonWorker()
        case 'yaml':
          return new YamlWorker()
        case 'typescript':
        case 'javascript':
          return new TsWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new CssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new HtmlWorker()
        default:
          return new EditorWorker()
      }
    },
  }
}
