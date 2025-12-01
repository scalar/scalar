import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'
import { type MaybeRefOrGetter, type Ref, computed, ref, toValue, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getTabDetails } from '@/v2/helpers/get-tab-details'
import type { GetEntryByLocation } from '@/v2/hooks/use-sidebar-state'

/** Constants for workspace store keys */
const TABS_KEY = 'x-scalar-tabs' as const
const ACTIVE_TAB_KEY = 'x-scalar-active-tab' as const
const LOAD_FROM_SESSION_QUERY = 'loadFromSession' as const

export type UseTabsReturn = {
  tabs: Ref<Tab[]>
  activeTabIndex: Ref<number>
  copyTabUrl: (index: number) => Promise<void>
  isLoading: Ref<boolean>
}

type UseTabsParams = {
  workspaceStore: Ref<WorkspaceStore | null>
  eventBus: WorkspaceEventBus
  workspaceSlug: MaybeRefOrGetter<string | undefined>
  documentSlug: MaybeRefOrGetter<string | undefined>
  path: MaybeRefOrGetter<string | undefined>
  method: MaybeRefOrGetter<HttpMethod | undefined>
  getEntryByLocation: GetEntryByLocation
}

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
}: UseTabsParams): UseTabsReturn => {
  const router = useRouter()
  const route = useRoute()

  const isLoading = ref(false)

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

  const tabs = computed(() => {
    return workspaceStore.value?.workspace[TABS_KEY] ?? [createTabFromCurrentRoute()]
  })

  const activeTabIndex = computed(() => {
    return workspaceStore.value?.workspace[ACTIVE_TAB_KEY] ?? 0
  })

  /**
   * Copies the URL of the tab at the given index to the clipboard.
   * Constructs the full URL using the current origin and the tab path.
   *
   * @throws Will silently fail if clipboard API is unavailable or the tab does not exist.
   */
  const copyTabUrl = async (index: number): Promise<void> => {
    const tab = tabs.value[index]

    if (!tab) {
      console.warn(`Cannot copy URL: tab at index ${index} does not exist`)
      return
    }

    const url = `${window.location.origin}${tab.path}`

    try {
      await navigator.clipboard.writeText(url)
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
    }
  }

  /**
   * Updates the tab at the active index with the new route path.
   */
  const updateActiveTabPath = (newPath: string): void => {
    const updatedTabs = [...tabs.value]
    updatedTabs[workspaceStore.value?.workspace[ACTIVE_TAB_KEY] ?? 0] = {
      ...createTabFromCurrentRoute(),
      path: newPath,
    }

    eventBus.emit('tabs:update:tabs', {
      [TABS_KEY]: updatedTabs,
    })
  }

  /**
   * Checks if we should load the workspace from the saved session.
   */
  const shouldLoadFromSession = (): boolean => {
    return route.query[LOAD_FROM_SESSION_QUERY] === 'true'
  }

  // Initialize the tabs
  watch(
    [() => workspaceStore.value, () => workspaceStore.value?.workspace[TABS_KEY]],
    ([store, tabs]) => {
      if (!store) {
        isLoading.value = true
        return
      }

      // Initialize the tabs
      if (!tabs) {
        eventBus.emit('tabs:update:tabs', {
          [TABS_KEY]: [createTabFromCurrentRoute()],
        })
      }

      if (tabs) {
        isLoading.value = false
      }
    },
    { immediate: true },
  )

  // Navigate correctly when the active tab changes
  watch(
    [
      () => workspaceStore.value?.workspace[TABS_KEY],
      () => workspaceStore.value?.workspace[ACTIVE_TAB_KEY],
      () => isLoading.value,
      () => toValue(workspaceSlug),
    ],
    async ([tabs, activeTabIndex, , newWorkspaceSlug], [, , , oldWorkspaceSlug]) => {
      if (isLoading.value) {
        return
      }

      // Do not navigate if we are switching workspaces (but allow initial load when oldWorkspaceSlug is undefined)
      if (oldWorkspaceSlug !== undefined && newWorkspaceSlug !== oldWorkspaceSlug) {
        return
      }

      const activeTab = tabs?.[activeTabIndex ?? 0]

      if (!activeTab) {
        return
      }

      // If the current path is not the path of the active tab, navigate to it
      if (route.path !== activeTab.path) {
        await router.push(activeTab.path)
      }
    },
    { immediate: true },
  )

  // When the route path changes, update the store with the new path
  watch(
    [() => route.path, () => isLoading.value, () => toValue(workspaceSlug)],
    ([newPath, , newWorkspaceSlug], [, , oldWorkspaceSlug]) => {
      if (isLoading.value) {
        return
      }

      const activeTab =
        workspaceStore.value?.workspace[TABS_KEY]?.[workspaceStore.value?.workspace[ACTIVE_TAB_KEY] ?? 0]

      if (!activeTab) {
        return
      }

      // Do not update the tab if we are switching workspaces (but allow initial load when oldWorkspaceSlug is undefined)
      if (oldWorkspaceSlug !== undefined && newWorkspaceSlug !== oldWorkspaceSlug) {
        return
      }

      // If the current path is not the path of the active tab, update the active tab path
      if (newPath !== activeTab.path && !shouldLoadFromSession()) {
        updateActiveTabPath(newPath)
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
