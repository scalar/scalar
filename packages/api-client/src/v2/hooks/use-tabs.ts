import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarTabs } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'
import { type MaybeRefOrGetter, type Ref, computed, ref, toValue, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getTabDetails } from '@/v2/helpers/get-tab-details'
import type { GetEntryByLocation } from '@/v2/hooks/use-sidebar-state'

type Tab = NonNullable<XScalarTabs['x-scalar-tabs']>[number]

/**
 * Composable for managing desktop tabs functionality.
 *
 * Handles tab creation, switching, closing, and synchronization with the current route.
 * Tabs are persisted in the workspace store to maintain state across sessions.
 */
export const useTabs = ({
  workspaceStore,
  getEntryByLocation,
  workspaceSlug,
  documentSlug,
  path,
  method,
  eventBus,
}: {
  workspaceStore: Ref<WorkspaceStore | null>
  eventBus: WorkspaceEventBus
  workspaceSlug: MaybeRefOrGetter<string | undefined>
  documentSlug: MaybeRefOrGetter<string | undefined>
  path: MaybeRefOrGetter<string | undefined>
  method: MaybeRefOrGetter<HttpMethod | undefined>
  getEntryByLocation: GetEntryByLocation
}) => {
  const router = useRouter()
  const route = useRoute()

  const isLoading = ref(true)

  /**
   * Creates a tab object based on the current route and workspace state.
   * Used as a fallback when no tabs exist or when creating new tabs.
   */
  const createTabFromCurrentRoute = (): Tab => {
    return {
      ...getTabDetails({
        workspace: toValue(workspaceSlug),
        document: toValue(documentSlug),
        path: toValue(path),
        method: toValue(method),
        getEntryByLocation,
      }),
      path: route.path,
    }
  }

  /**
   * Array of tabs stored in the workspace.
   * Falls back to a single tab based on the current route if no tabs exist.
   */
  const tabs = computed((): Tab[] => {
    return workspaceStore.value?.workspace['x-scalar-tabs'] ?? [createTabFromCurrentRoute()]
  })

  /**
   * Index of the currently active tab.
   * Defaults to 0 if not set in the store.
   */
  const activeTabIndex = computed((): number => {
    return workspaceStore.value?.workspace['x-scalar-active-tab'] ?? 0
  })

  /**
   * The currently active tab object.
   * Falls back to creating a tab from the current route if not found.
   */
  const activeTab = computed((): Tab => {
    return tabs.value[activeTabIndex.value] ?? createTabFromCurrentRoute()
  })

  /**
   * Copies the URL of the tab at the given index to the clipboard.
   * Constructs the full URL using the current origin and the tab path.
   */
  const copyTabUrl = (index: number): void => {
    const tab = tabs.value[index]

    if (!tab) {
      return
    }

    const url = `${window.location.origin}${tab.path}`
    navigator.clipboard.writeText(url)
  }

  watch(
    () => workspaceStore.value,
    (store) => {
      if (!store) {
        return
      }

      // Initialize the tabs of the store if none exist
      if (!store.workspace['x-scalar-tabs']) {
        eventBus.emit('tabs:update:tabs', {
          'x-scalar-tabs': tabs.value,
        })
      }
    },
    { immediate: true },
  )

  /**
   * Synchronizes the route with the active tab when loading from a saved session.
   * This ensures users return to the tab they were last viewing.
   */
  watch(
    [
      () => workspaceStore.value?.workspace['x-scalar-tabs'],
      () => workspaceStore.value?.workspace['x-scalar-active-tab'],
    ],
    async () => {
      const store = workspaceStore.value

      if (!store) {
        isLoading.value = true
        return
      }

      const shouldLoadFromSession = route.query.loadFromSession === 'true'

      /**
       * Get the active tab from the updated store.
       * Since we're watching the nested properties directly, this will have the latest values.
       */
      const currentActiveTab = activeTab.value

      /**
       * Only navigate to the saved tab path if we are loading from session
       * and the saved path differs from the current route.
       */
      if (shouldLoadFromSession && currentActiveTab.path !== route.path) {
        await router.replace(currentActiveTab.path)
      }

      isLoading.value = false
    },
    { immediate: true },
  )

  /**
   * Updates the active tab when the route changes.
   * This ensures the tab state stays in sync with navigation events.
   */
  watch(
    [() => route.path, () => workspaceStore.value],
    ([newPath, store]) => {
      if (!store) {
        return
      }

      const currentActiveTab = activeTab.value

      /**
       * Update the active tab to reflect the new path if it has changed.
       * This happens during manual navigation (not loading from session).
       */
      if (currentActiveTab && currentActiveTab.path !== newPath) {
        const updatedTabs = [...tabs.value]
        updatedTabs[activeTabIndex.value] = {
          ...createTabFromCurrentRoute(),
          path: newPath,
        }

        eventBus.emit('tabs:update:tabs', {
          'x-scalar-tabs': updatedTabs,
        })
      }
    },
    { immediate: true },
  )

  return {
    tabs,
    activeTabIndex,
    copyTabUrl,
    isLoading,
  }
}
