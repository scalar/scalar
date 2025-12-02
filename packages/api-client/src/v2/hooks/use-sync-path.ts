import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { DEFAULT_WORKSPACE, type UseWorkspaceSelectorReturn } from '@/v2/hooks/use-workspace-selector'

import type { UseTabsReturn } from './use-tabs'

const LOAD_FROM_SESSION_QUERY = 'loadFromSession' as const

export const useSyncPath = ({
  workspaceSelectorState,
  tabsState,
}: {
  workspaceSelectorState: UseWorkspaceSelectorReturn
  tabsState: UseTabsReturn
}) => {
  const route = useRoute()
  const router = useRouter()

  // Keeps a loading state until we sync the tabs and the path
  const isLoading = ref(false)

  /**
   * Checks if we should load the workspace from the saved session.
   */
  const shouldLoadFromSession = (): boolean => {
    return route.query[LOAD_FROM_SESSION_QUERY] === 'true'
  }

  const sync = async (fn?: (props: { tabPath: string }) => Promise<void> | void) => {
    const store = workspaceSelectorState.store.value

    if (!store) {
      return
    }

    const tabs = store.workspace['x-scalar-tabs'] ?? []
    const index = store.workspace['x-scalar-active-tab'] ?? 0

    const tab = tabs[index]

    if (!tab) {
      return
    }

    if (tab.path === route.path) {
      return
    }

    await fn?.({ tabPath: tab.path })
  }

  const updateCurrentTab = () => {
    const store = workspaceSelectorState.store.value

    if (!store) {
      return
    }

    const tabs = store.workspace['x-scalar-tabs']
    const index = store.workspace['x-scalar-active-tab'] ?? 0

    if (!tabs?.[index]) {
      return
    }

    // Update the current tab path
    tabs[index] = tabsState.createTabFromCurrentRoute()
  }

  // Sync the path when the active tab changes
  watch(
    [
      () => workspaceSelectorState.store.value?.workspace['x-scalar-tabs'],
      () => workspaceSelectorState.store.value?.workspace['x-scalar-active-tab'],
      () => workspaceSelectorState.activeWorkspace.value?.id,
    ],
    async ([_tabs, _activeTab, workspaceId], [_newTabs, _newActiveTab, newWorkspaceId]) => {
      // When we switch workspace, we do not want to sync the path
      if (!shouldLoadFromSession() && workspaceId !== newWorkspaceId) {
        isLoading.value = false
        return
      }

      // Sync the router path with the active tab path
      await sync(async ({ tabPath }) => {
        await router.push(tabPath)
        isLoading.value = false
      })
    },
  )

  watch([() => route.path], async () => {
    const slug = route.params.workspaceSlug

    // When the worksapce changes
    if (typeof slug === 'string' && slug !== workspaceSelectorState.activeWorkspace.value?.id) {
      // Clear the store before we load the new wroksapce
      workspaceSelectorState.store.value = null
      isLoading.value = true

      // Load the workspace if the slug is different
      if (await workspaceSelectorState.loadWorkspace(slug)) {
        // Sync the tab with the new path
        await sync(updateCurrentTab)
        return
      }

      // Create the default workspace and navigate to it
      await workspaceSelectorState.createWorkspace({ name: DEFAULT_WORKSPACE.name })

      // Navigate to the default workspace
      return await workspaceSelectorState.setWorkspaceId(DEFAULT_WORKSPACE.id)
    }

    // Sync the tab with the new path
    await sync(updateCurrentTab)
  })

  return {
    isLoading,
  }
}
