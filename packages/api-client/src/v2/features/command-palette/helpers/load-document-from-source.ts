import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { parseJson, parseYaml } from '@scalar/json-magic/bundle/plugins/browser'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { getOpenApiFromPostman } from '@/v2/features/command-palette/helpers/get-openapi-from-postman'
import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'

export type ImportEventData = {
  source: string
  type: 'url' | 'file' | 'raw'
}

/**
 * Loader plugin to detect and convert Postman collections into OpenAPI documents
 */
export const readPostmanCollection = (): LoaderPlugin => {
  return {
    type: 'loader',
    validate: isPostmanCollection,
    exec: (source: string) => {
      try {
        const document = getOpenApiFromPostman(source)

        if (document) {
          return Promise.resolve({
            ok: true,
            data: document,
            raw: source,
          })
        }

        return Promise.resolve({
          ok: false,
        })
      } catch {
        return Promise.resolve({
          ok: false,
        })
      }
    },
  }
}

/**
 * Attempts to add a document to the workspace from a given source, which may be a URL or raw content.
 *
 * - If the source is a URL, adds the document by its URL and includes a watch mode flag as metadata.
 * - If the source is a Postman collection, transforms it to OpenAPI and adds it as a document.
 * - For other raw sources (such as pasted JSON or YAML), attempts to normalize and add them as a document.
 *
 * @param workspaceStore The workspace store where the document will be added.
 * @param source The document source (URL, Postman Collection, JSON, or YAML string).
 * @param name The display name for the new document.
 * @param watchMode Whether to enable watch mode (applies only to URL sources).
 * @returns Promise resolving to true if the document was successfully added, or false if the operation failed.
 */
export const loadDocumentFromSource = async (
  workspaceStore: WorkspaceStore,
  importEventData: ImportEventData,
  name: string,
  watchMode: boolean,
): Promise<boolean> => {
  const { source, type } = importEventData
  if (!source) {
    // No source provided, do nothing.
    return false
  }

  // If the source is a URL, add it directly with watch mode metadata.
  if (type === 'url') {
    return await workspaceStore.addDocument({
      name,
      url: source,
      meta: {
        'x-scalar-watch-mode': watchMode,
      },
    })
  }

  if (type === 'file') {
    return await workspaceStore.addDocument({
      name,
      path: source,
    })
  }

  const loaders = [readPostmanCollection(), parseJson(), parseYaml()]
  const loader = loaders.find((l) => l.validate(source))

  // If no loader is found, return false
  if (!loader) {
    return false
  }

  // Execute the loader
  const result = await loader.exec(source)
  // If the loader failed, return false
  if (!result.ok) {
    return false
  }

  if (!isObject(result.data)) {
    return false
  }

  const addDocumentResult = await workspaceStore.addDocument({
    name,
    document: result.data,
  })

  if (!addDocumentResult) {
    return false
  }

  return true
}
