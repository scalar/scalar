import * as monaco from 'monaco-editor'

import type { JsonPath } from './json-ast'
import { getJsonAstNodeAtPath } from './json-ast'

/** Rejected by Monaco until the JSON mode `setupMode()` hook has registered the worker (race with `getMode()`). */
const MONACO_JSON_WORKER_NOT_READY = 'JSON not registered!' as const

const MAX_JSON_WORKER_READY_ATTEMPTS = 40

const getMonacoJsonWorker = async (): ReturnType<typeof monaco.languages.json.getWorker> => {
  for (let attempt = 0; attempt < MAX_JSON_WORKER_READY_ATTEMPTS; attempt++) {
    try {
      return await monaco.languages.json.getWorker()
    } catch (error) {
      if (error !== MONACO_JSON_WORKER_NOT_READY) {
        throw error
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })
    }
  }

  return await monaco.languages.json.getWorker()
}

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
  const worker = await getMonacoJsonWorker()
  const jsonWorker = await worker(model.uri)

  // Monaco's JSON worker keeps an internal (incremental) AST; no JSON.parse needed.
  const jsonDocument = await jsonWorker.parseJSONDocument(model.uri.toString())
  if (!jsonDocument?.root) {
    return null
  }

  return getJsonAstNodeAtPath(jsonDocument.root, path) ?? null
}
