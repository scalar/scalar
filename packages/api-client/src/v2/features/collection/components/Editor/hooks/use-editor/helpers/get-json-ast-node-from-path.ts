import * as monaco from 'monaco-editor'

import { getJsonAstNodeAtPath } from './json-ast'
import type { JsonPath } from './json-path'

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
