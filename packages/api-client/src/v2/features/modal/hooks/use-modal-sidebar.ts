import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createSidebarState, generateReverseIndex, getChildEntry } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { type ComputedRef, computed, toValue, watch } from 'vue'

import type { RoutePayload } from '@/v2/features/modal/helpers/resolve-route-parameters'
import { generateLocationId } from '@/v2/helpers/generate-location-id'

export type UseModalSidebarReturn = {
  handleSelectItem: (id: string) => void
  state: ReturnType<typeof createSidebarState<TraversedEntry>>
  getEntryByLocation: (location: {
    document: string
    path?: string
    method?: HttpMethod
    example?: string
  }) => TraversedEntry | undefined
}

/**
 * useSidebarState - Custom hook to manage the sidebar state and navigation logic in the Scalar API client
 *
 * This composable manages the sidebar structure, synchronizes selection state
 * with the current route, and provides a handler for selecting sidebar items.
 *
 * Example usage:
 *
 * const { handleSelectItem, sidebarState } = useSidebarState({
 *   workspaceStore,
 *   workspaceSlug,
 *   documentSlug,
 *   path,
 *   method,
 *   exampleName,
 * })
 */
export const useModalSidebar = ({
  workspaceStore,
  documentSlug,
  path,
  method,
  exampleName,
  route,
}: {
  workspaceStore: WorkspaceStore | null
  documentSlug: ComputedRef<string | undefined>
  path: ComputedRef<string | undefined>
  method: ComputedRef<HttpMethod | undefined>
  exampleName: ComputedRef<string | undefined>
  route: (payload: RoutePayload) => void
}): UseModalSidebarReturn => {
  const entries = computed(
    () => workspaceStore?.workspace.documents[toValue(documentSlug) ?? '']?.['x-scalar-navigation']?.children ?? [],
  )
  const state = createSidebarState(entries)

  /**
   * Computed index for fast lookup of sidebar nodes by their unique API location.
   *
   * - Only indexes nodes of type 'operation', or 'example'.
   * - The lookup key is a serialized array of: [operationPath, operationMethod, exampleName?].
   * - Supports precise resolution of sidebar entries given an API "location".
   */
  const locationIndex = computed(() =>
    generateReverseIndex({
      items: entries.value,
      nestedKey: 'children',
      filter: (node) => node.type === 'operation' || node.type === 'example',
      getId: (node) => {
        const operation = getParentEntry('operation', node)
        return generateLocationId({
          document: toValue(documentSlug) ?? '',
          path: operation?.path,
          method: operation?.method,
          example: node.type === 'example' ? node.name : undefined,
        })
      },
    }),
  )

  /**
   * Looks up a sidebar entry by its unique API location.
   * - First tries to find an entry matching all provided properties (including example).
   * - If not found, falls back to matching only the operation (ignores example field).
   * This allows resolving either examples, operations, or documents as appropriate.
   *
   * @param location - Object specifying the document name, path, method, and optional example name.
   * @returns The matching sidebar entry, or undefined if none found.
   *
   * Example:
   *   const entry = getEntryByLocation({
   *     document: 'pets',
   *     path: '/pets',
   *     method: 'get',
   *     example: 'default',
   *   })
   */
  const getEntryByLocation: UseModalSidebarReturn['getEntryByLocation'] = (location) => {
    // Try to find an entry with the most-specific location (including example)
    const entryWithExample = locationIndex.value.get(
      generateLocationId({
        document: location.document,
        path: location.path,
        method: location.method,
        example: location.example,
      }),
    )

    if (entryWithExample) {
      return entryWithExample
    }

    // Fallback to the operation (ignoring example) if an example wasn't found or specified
    return locationIndex.value.get(
      generateLocationId({
        document: location.document,
        path: location.path,
        method: location.method,
      }),
    )
  }

  /**
   * Handles item selection from the sidebar and routes navigation accordingly.
   *
   * Example:
   *   handleSelectItem('id-of-entry')
   */
  const handleSelectItem = (id: string) => {
    const entry = state.getEntryById(id)

    if (!entry) {
      console.warn(`Could not find sidebar entry with id ${id} to select`)
      return
    }

    // Navigate to the example page
    if (entry.type === 'operation' || entry.type === 'example') {
      // If we are already in the operation, just toggle expansion
      if (state.isSelected(id)) {
        state.setExpanded(id, !state.isExpanded(id))
        return
      }

      const operation = getParentEntry('operation', entry)
      const example = getChildEntry('example', entry)

      if (example) {
        state.setSelected(example.id)
        state.setExpanded(example.id, true)
      } else {
        state.setSelected(id)
      }

      if (!operation) {
        return
      }

      return route({
        documentSlug: toValue(documentSlug),
        path: operation.path,
        method: operation.method,
        example: example?.name ?? 'default',
      })
    }

    state.setExpanded(id, !state.isExpanded(id))
    return
  }

  /** Keep the sidebar state in sync with the modal parameters */
  watch(
    [documentSlug, path, method, exampleName],
    ([newDocument, newPath, newMethod, newExample]) => {
      if (!newDocument) {
        // Reset selection if no document is selected
        state.setSelected(null)
        return
      }

      const entry = getEntryByLocation({
        document: newDocument,
        path: newPath,
        method: newMethod,
        example: newExample,
      })

      if (entry) {
        state.setSelected(entry.id)
        state.setExpanded(entry.id, true)
      }
    },
    {
      immediate: true,
    },
  )

  return {
    handleSelectItem,
    state,
    getEntryByLocation,
  }
}
