import fs from 'node:fs/promises'

import type { WorkspaceStore } from '@/client'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

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
 * Test helper: cast `store.workspace.activeDocument` to `OpenApiDocument`.
 *
 * Tests in this package overwhelmingly use OpenAPI fixtures, but
 * `activeDocument` is typed as the `OpenApiDocument | AsyncApiDocument` union.
 * This localizes the cast so individual assertions stay readable.
 */
export const getActiveOpenApiDocument = (store: WorkspaceStore): OpenApiDocument | undefined =>
  store.workspace.activeDocument as OpenApiDocument | undefined

/**
 * Test helper: cast a workspace document by name to `OpenApiDocument`. See
 * {@link getActiveOpenApiDocument} for rationale.
 */
export const getOpenApiDocument = (store: WorkspaceStore, name: string): OpenApiDocument | undefined =>
  store.workspace.documents[name] as OpenApiDocument | undefined
