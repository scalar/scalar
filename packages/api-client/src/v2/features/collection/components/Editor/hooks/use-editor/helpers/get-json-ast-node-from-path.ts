import * as monaco from 'monaco-editor'

import { getJsonAstNodeAtPath } from './json-ast'
import type { JsonPath } from './json-ast'

/**
 * Retrieves a JSON AST node from a Monaco editor model at the specified JSON path.
 *
 * Utilizes Monaco's JSON worker to parse the document and returns the AST node
 * located at the given path, or null if not found.
 *
 * @param model - The Monaco editor text model representing the JSON document.
 * @param path - The JSON path to locate the AST node.
 * @returns A promise resolving to the AST node at the path, or null if not found.
 */
export const getJsonAstNodeFromPath = async (
  model: monaco.editor.ITextModel,
  path: JsonPath,
): Promise<monaco.languages.json.ASTNode | null> => {
  const worker = await monaco.languages.json.getWorker()
  const jsonWorker = await worker(model.uri)

  // Monaco's JSON worker keeps an internal (incremental) AST; no JSON.parse needed.
  const jsonDocument = await jsonWorker.parseJSONDocument(model.uri.toString())
  if (!jsonDocument?.root) {
    return null
  }

  return getJsonAstNodeAtPath(jsonDocument.root, path) ?? null
}
