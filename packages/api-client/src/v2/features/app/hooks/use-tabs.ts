import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace'
import { type MaybeRefOrGetter, type Ref, computed, ref, toValue } from 'vue'
import { useRoute } from 'vue-router'

import type { UseAppSidebarReturn } from '@/v2/features/app/hooks/use-app-sidebar'
import { getTabDetails } from '@/v2/helpers/get-tab-details'

/** Constants for workspace store keys */
const TABS_KEY = 'x-scalar-tabs' as const
const ACTIVE_TAB_KEY = 'x-scalar-active-tab' as const

export type UseTabsReturn = {
  tabs: Ref<Tab[]>
  activeTabIndex: Ref<number>
  copyTabUrl: (index: number) => Promise<void>
  isLoading: Ref<boolean>
  createTabFromCurrentRoute: () => Tab
}

type UseTabsParams = {
  workspaceStore: Ref<WorkspaceStore | null>
  eventBus: WorkspaceEventBus
  workspaceSlug: MaybeRefOrGetter<string | undefined>
  documentSlug: MaybeRefOrGetter<string | undefined>
  path: MaybeRefOrGetter<string | undefined>
  method: MaybeRefOrGetter<HttpMethod | undefined>
  getEntryByLocation: UseAppSidebarReturn['getEntryByLocation']
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
}: UseTabsParams): UseTabsReturn => {
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

  return {
    tabs,
    activeTabIndex,
    copyTabUrl,
    isLoading,
    createTabFromCurrentRoute,
  }
}
