import { isDefined } from '@scalar/helpers/array/is-defined'
import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createSidebarState, generateReverseIndex } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { type MaybeRefOrGetter, computed, toValue, watch } from 'vue'
import { useRouter } from 'vue-router'

export type UseAppSidebarReturn = {
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
export const useAppSidebar = ({
  workspaceStore,
  documentSlug,
  path,
  method,
  exampleName,
}: {
  workspaceStore: MaybeRefOrGetter<WorkspaceStore | null>
  documentSlug: MaybeRefOrGetter<string | undefined>
  path: MaybeRefOrGetter<string | undefined>
  method: MaybeRefOrGetter<HttpMethod | undefined>
  exampleName: MaybeRefOrGetter<string | undefined>
}): UseAppSidebarReturn => {
  const router = useRouter()

  const entries = computed(() => {
    const store = toValue(workspaceStore)
    if (!store) {
      return []
    }

    const order = store.workspace['x-scalar-order'] ?? Object.keys(store.workspace.documents)

    return sortByOrder(Object.keys(store.workspace.documents), order, (item) => item)
      .map((doc) => store.workspace.documents[doc]?.['x-scalar-navigation'])
      .filter(isDefined) as TraversedEntry[]
  })

  const state = createSidebarState(entries)

  // Reset the sidebar state when the we switch workspace
  watch(
    () => toValue(workspaceStore),
    () => {
      state.reset()
    },
    {
      immediate: true,
    },
  )

  /**
   * Generates a unique string ID for an API location, based on the document, path, method, and example.
   * Filters out undefined values and serializes the composite array into a stable string.
   *
   * @param params - An object containing document, path, method, and optional example name.
   * @returns A stringified array representing the unique location identifier.
   *
   * Example:
   *   generateId({ document: 'mydoc', path: '/users', method: 'get', example: 'default' })
   *   // => '["mydoc","/users","get","default"]'
   */
  const generateId = ({
    document,
    path,
    method,
    example,
  }: {
    document: string
    path?: string
    method?: HttpMethod
    example?: string
  }) => {
    return JSON.stringify([document, path, method, example].filter(isDefined))
  }

  /**
   * Computed index for fast lookup of sidebar nodes by their unique API location.
   *
   * - Only indexes nodes of type 'document', 'operation', or 'example'.
   * - The lookup key is a serialized array of: [documentName, operationPath, operationMethod, exampleName?].
   * - Supports precise resolution of sidebar entries given an API "location".
   */
  const locationIndex = computed(() =>
    generateReverseIndex({
      items: entries.value,
      nestedKey: 'children',
      filter: (node) => node.type === 'document' || node.type === 'operation' || node.type === 'example',
      getId: (node) => {
        const document = getParentEntry('document', node)
        const operation = getParentEntry('operation', node)
        return generateId({
          document: document?.name ?? '',
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
  const getEntryByLocation: UseAppSidebarReturn['getEntryByLocation'] = (location) => {
    // Try to find an entry with the most-specific location (including example)
    const entryWithExample = locationIndex.value.get(generateId(location))

    if (entryWithExample) {
      return entryWithExample
    }

    // Fallback to the operation (ignoring example) if an example wasn't found or specified
    return locationIndex.value.get(
      generateId({
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

    // Navigate to the document overview page
    if (entry.type === 'document') {
      state.setSelected(id)
      state.setExpanded(id, !state.isExpanded(id))
      return router.push({
        name: 'document.overview',
        params: { documentSlug: entry.name },
      })
    }

    // Navigate to the example page
    // TODO: temporary until we have the operation overview page
    if (entry.type === 'operation') {
      // If we are already in the operation, just toggle expansion
      if (state.isSelected(id)) {
        state.setExpanded(id, !state.isExpanded(id))
        return
      }

      const firstExample = entry.children?.find((child) => child.type === 'example')

      if (firstExample) {
        state.setSelected(firstExample.id)
        state.setExpanded(firstExample.id, true)
      } else {
        state.setSelected(id)
      }

      return router.push({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(entry.path),
          method: entry.method,
          exampleName: firstExample?.name ?? 'default',
        },
      })
    }

    // Navigate to the example page
    if (entry.type === 'example') {
      state.setSelected(id)
      state.setExpanded(id, true)
      const operation = getParentEntry('operation', entry)
      return router.push({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(operation?.path ?? ''),
          method: operation?.method,
          exampleName: entry.name,
        },
      })
    }

    if (entry.type === 'text') {
      return router.push({
        name: 'document.overview',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
        },
      })
    }

    state.setExpanded(id, !state.isExpanded(id))
    return
  }

  /** Keep the router and the sidebar state in sync */
  watch(
    [
      () => toValue(workspaceStore),
      () => toValue(documentSlug),
      () => toValue(path),
      () => toValue(method),
      () => toValue(exampleName),
    ],
    () => {
      const newDocument = toValue(documentSlug)
      const newPath = toValue(path)
      const newMethod = toValue(method)
      const newExample = toValue(exampleName)

      if (!newDocument) {
        // Reset selection if no document is selected
        state.setSelected(null)
        return
      }

      const entry = getEntryByLocation({
        document: newDocument as string,
        path: newPath as string,
        method: newMethod as HttpMethod,
        example: newExample as string,
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
