import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarTabs } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from 'vue'
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
}: {
  workspaceStore: MaybeRefOrGetter<WorkspaceStore | null>
  eventBus?: WorkspaceEventBus
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
   * Returns the default fallback tab to use when no tabs exist.
   * This ensures there is always at least one tab available.
   */
  const getCurrentTabDetails = (): Tab => {
    return {
      ...getTabDetails({
        workspace: toValue(workspaceSlug),
        document: toValue(documentSlug),
        path: toValue(path),
        method: toValue(method),
        getEntryByLocation,
      }),
      path: route.fullPath,
    }
  }

  /**
   * Helper to safely get the current workspace store.
   * Returns null if the store is not available.
   */
  const getStore = (): WorkspaceStore | null => {
    return toValue(workspaceStore)
  }

  /**
   * Helper to get tabs array from the store with a fallback.
   */
  const getTabsFromStore = (store: WorkspaceStore): Tab[] => {
    return store.workspace['x-scalar-tabs'] ?? [getCurrentTabDetails()]
  }

  /**
   * Helper to get the active tab index from the store.
   */
  const getActiveTabIndex = (store: WorkspaceStore): number => {
    return store.workspace['x-scalar-active-tab'] ?? 0
  }

  /**
   * Whenever we switch workspace, load the active tab for the new workspace.
   * We want to preserve the tabs and the active tabs for all the workspaces.
   */
  watch(
    () => getStore(),
    async (store) => {
      if (!store) {
        isLoading.value = true
        return
      }

      const storeTabs = getTabsFromStore(store)
      const activeIndex = getActiveTabIndex(store)
      const activeTab = storeTabs[activeIndex]

      /** Load the active tab for the workspace if there is one and it differs from current route */
      if (activeTab && activeTab.path !== route.fullPath) {
        await router.push(activeTab.path)
      }

      isLoading.value = false
    },
    {
      immediate: true,
    },
  )

  /** Array of tabs stored in the workspace */
  const tabs = computed((): Tab[] => {
    const store = getStore()
    return store ? getTabsFromStore(store) : [getCurrentTabDetails()]
  })

  /** Index of the currently active tab */
  const activeTab = computed((): number => {
    const store = getStore()
    return store ? getActiveTabIndex(store) : 0
  })

  /**
   * Adds a new tab with the given path.
   * Sets the new tab as active and navigates to it.
   */
  const addTab = (path: string): void => {
    const store = getStore()
    if (!store) {
      return
    }

    const currentTabs = getTabsFromStore(store)
    const newTabs: Tab[] = [...currentTabs, getCurrentTabDetails()]
    const newIndex = newTabs.length - 1

    store.update('x-scalar-tabs', newTabs)
    store.update('x-scalar-active-tab', newIndex)

    router.push(path)
  }

  /**
   * Switches to the tab at the given index.
   * Navigates to the path stored in that tab.
   */
  const switchTab = (index: number): void => {
    const store = getStore()
    if (!store) {
      return
    }

    const currentTabs = getTabsFromStore(store)
    const tab = currentTabs[index]

    /** Validate the index is within bounds and the tab exists */
    if (!tab || index < 0 || index >= currentTabs.length) {
      return
    }

    store.update('x-scalar-active-tab', index)
    router.push(tab.path)
  }

  /**
   * Closes the tab at the given index.
   * If closing the active tab, switches to the next available tab.
   * Does not close the last remaining tab.
   */
  const closeTab = (index: number): void => {
    const store = getStore()
    if (!store) {
      return
    }

    const currentTabs = getTabsFromStore(store)

    /** Prevent closing the last tab */
    if (currentTabs.length <= 1) {
      return
    }

    const newTabs = currentTabs.filter((_, i) => i !== index)
    const currentActive = getActiveTabIndex(store)

    let newActive = currentActive

    /** If we closed the active tab, determine which tab to switch to */
    if (index === currentActive) {
      /** If we closed the last tab, go to the previous one */
      newActive = index >= newTabs.length ? newTabs.length - 1 : index
    } else if (index < currentActive) {
      /** If we closed a tab before the active one, adjust the active index */
      newActive = currentActive - 1
    }

    const newActiveTab = newTabs[newActive]
    if (!newActiveTab) {
      return
    }

    store.update('x-scalar-tabs', newTabs)
    store.update('x-scalar-active-tab', newActive)

    /** Navigate to the new active tab */
    router.push(newActiveTab.path)
  }

  /**
   * Closes all tabs except the one at the given index.
   * Sets the remaining tab as active and navigates to it.
   */
  const closeOtherTabs = (index: number): void => {
    const store = getStore()
    if (!store) {
      return
    }

    const currentTabs = getTabsFromStore(store)
    const remainingTab = currentTabs[index]

    /** Validate the index is within bounds and the tab exists */
    if (!remainingTab || index < 0 || index >= currentTabs.length) {
      return
    }

    store.update('x-scalar-tabs', [remainingTab])
    store.update('x-scalar-active-tab', 0)

    router.push(remainingTab.path)
  }

  /**
   * Copies the URL of the tab at the given index to the clipboard.
   * Constructs the full URL using the current origin and the tab path.
   */
  const copyTabUrl = (index: number): void => {
    const currentTabs = tabs.value
    const tab = currentTabs[index]

    /** Validate the index is within bounds and the tab exists */
    if (!tab || index < 0 || index >= currentTabs.length) {
      return
    }

    const url = `${window.location.origin}${tab.path}`
    navigator.clipboard.writeText(url)
  }

  /**
   * Watches the route and updates the active tab path when it changes.
   * This keeps the tab in sync with the current location, ensuring navigation
   * is properly reflected in the tab state.
   */
  watch(
    () => route.fullPath,
    (newPath) => {
      const store = getStore()
      if (!store) {
        return
      }

      const currentTabs = getTabsFromStore(store)
      const currentActive = getActiveTabIndex(store)
      const activeTab = currentTabs[currentActive]

      /** Update the active tab to reflect the new path if it has changed */
      if (activeTab && activeTab.path !== newPath) {
        const updatedTabs = [...currentTabs]
        updatedTabs[currentActive] = { ...getCurrentTabDetails(), path: newPath }
        store.update('x-scalar-tabs', updatedTabs)
      }
    },
  )

  return {
    tabs,
    activeTab,
    addTab,
    switchTab,
    closeTab,
    closeOtherTabs,
    copyTabUrl,
    isLoading,
  }
}
