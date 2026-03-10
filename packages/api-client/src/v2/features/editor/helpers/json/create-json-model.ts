import * as monaco from 'monaco-editor'

import { getJsonAstNodeFromPath } from '@/v2/features/editor/helpers/json/get-json-ast-node-from-path'
import type { EditorModel, Path } from '@/v2/features/editor/helpers/model'

import { configureJson } from '../configure-language-support'

/**
 * Creates a JSON Monaco editor model with enhanced language support.
 *
 * @param value - The initial JSON content for the model.
 * @returns An object containing the Monaco model and a function to get a range from a JSON path.
 *
 * The returned `getRangeFromPath` function asynchronously finds the AST node for a JSON path,
 * converts its offset and length to a Monaco Range, or returns null if not found.
 */
export const createJsonModel = (value?: string): EditorModel => {
  const model = monaco.editor.createModel(value ?? '', 'json')

  // Configure language support
  configureJson(model.uri.toString())

  return {
    model,
    getRangeFromPath: async (path: Path) => {
      const node = await getJsonAstNodeFromPath(model, path)
      if (!node) {
        return null
      }

      // Convert the AST node to a range
      const start = model.getPositionAt(node.offset)
      const end = model.getPositionAt(node.offset + node.length)

      return new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column)
    },
  }
}
