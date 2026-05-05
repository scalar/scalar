import fs from 'node:fs/promises'

import type { WorkspaceStore } from '@/client'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import type { ServerWorkspaceStore } from '@/server'

export async function allFilesMatch(fileList: { path: string; content: string }[]): Promise<boolean> {
  for (const { content, path } of fileList) {
    try {
      const actualContent = await fs.readFile(path, 'utf8')
      if (actualContent !== content) {
        return false
      }
    } catch {
      // If file doesn't exist or any other read error
      return false
    }
  }
  return true
}

/**
 * Narrows a `WorkspaceDocument` to `OpenApiDocument` for tests, throwing if
 * the fixture is anything else. Tests in this package overwhelmingly use
 * OpenAPI fixtures and shouldn't paper over a wrong-type fixture by
 * `undefined`-chaining into nothing — fail loudly instead.
 */
const assertOpenApiOrUndefined = (doc: unknown, label: string): OpenApiDocument | undefined => {
  if (doc === undefined) {
    return undefined
  }
  if (!isOpenApiDocument(doc)) {
    throw new Error(`${label}: expected an OpenAPI document but got a different shape`)
  }
  return doc
}

/**
 * Test helper: narrow `store.workspace.activeDocument` to `OpenApiDocument`.
 *
 * `activeDocument` is typed as the `OpenApiDocument | AsyncApiDocument` union.
 * This localizes the narrowing so individual assertions stay readable, and
 * throws if the fixture is unexpectedly AsyncAPI rather than silently
 * pretending the document is OpenAPI.
 */
export const getActiveOpenApiDocument = (store: WorkspaceStore): OpenApiDocument | undefined =>
  assertOpenApiOrUndefined(store.workspace.activeDocument, 'getActiveOpenApiDocument')

/**
 * Test helper: narrow a workspace document by name to `OpenApiDocument`. See
 * {@link getActiveOpenApiDocument} for rationale.
 */
export const getOpenApiDocument = (store: WorkspaceStore, name: string): OpenApiDocument | undefined =>
  assertOpenApiOrUndefined(store.workspace.documents[name], `getOpenApiDocument('${name}')`)

/**
 * Server-side variant of {@link getOpenApiDocument}. Server stores expose
 * documents through `getWorkspace().documents` rather than `.workspace`, so
 * they need their own accessor.
 */
export const getOpenApiServerDocument = (store: ServerWorkspaceStore, name: string): OpenApiDocument | undefined =>
  assertOpenApiOrUndefined(store.getWorkspace().documents[name], `getOpenApiServerDocument('${name}')`)
