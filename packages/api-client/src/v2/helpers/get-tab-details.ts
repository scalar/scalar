import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace'

import type { GetEntryByLocation } from '@/v2/features/app/app-state'

/**
 * Returns display details for a tab in the API client UI.
 * Determines the title and icon to use based on workspace, document, path, and method.
 *
 * - If no workspace is provided, returns { title: 'Untitled Tab' }.
 * - If document is present, attempts to fetch an entry using getEntryByLocation, and returns:
 *    - { title: entry.title, icon: 'document' } for document entry types,
 *    - { title: entry.title, icon: 'request' } for all other types,
 *    - If no entry found, returns { title: 'Untitled Tab' }.
 * - If neither document nor entry is available, returns { title: 'Workspace' }.
 *
 * Example:
 * ```
 * const result = getTabDetails({
 *   workspace: "main",
 *   document: "doc1",
 *   path: "/users",
 *   method: "get",
 *   getEntryByLocation: ({ document, path, method }) => {
 *     // Mock lookup:
 *     if (document === "doc1" && path === "/users") {
 *       return { type: "document", title: "Users" }
 *     }
 *     return null
 *   }
 * })
 * // result: { title: "Users", icon: "document" }
 * ```
 */
export const getTabDetails = ({
  workspace,
  document,
  path,
  method,
  getEntryByLocation,
}: {
  workspace?: string
  document?: string
  path?: string
  method?: HttpMethod
  getEntryByLocation: GetEntryByLocation
}): { title: string; icon?: Tab['icon'] } => {
  if (!workspace) {
    return {
      title: 'Untitled Tab',
    }
  }

  if (document) {
    const entry = getEntryByLocation({
      document,
      path,
      method,
    })

    if (!entry) {
      return {
        title: 'Untitled Tab',
      }
    }

    if (entry.type === 'document') {
      return {
        title: entry.title,
        icon: 'document',
      }
    }

    return {
      title: entry.title,
      icon: 'request',
    }
  }

  return {
    title: 'Workspace',
  }
}
