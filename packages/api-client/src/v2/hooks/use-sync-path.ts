import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { workspaceStorage } from '@/v2/helpers/storage'
import { DEFAULT_WORKSPACE, type UseWorkspaceSelectorReturn } from '@/v2/hooks/use-workspace-selector'

import type { UseTabsReturn } from './use-tabs'

export const useSyncPath = ({
  workspaceSelectorState,
  tabsState,
  eventBus,
}: {
  workspaceSelectorState: UseWorkspaceSelectorReturn
  tabsState: UseTabsReturn
  eventBus: WorkspaceEventBus
}) => {
  const route = useRoute()
  const router = useRouter()
  const isLoading = ref(false)

  /**
   * Updates the current active tab in the workspace's "x-scalar-tabs" array
   * to reflect the current route state. This ensures the currently focused tab
   * stays in sync with the actual UI route and path.
   */
  const updateCurrentTabByRouterState = () => {
    const store = workspaceSelectorState.store.value

    if (!store) {
      return
    }

    const tabs = store.workspace['x-scalar-tabs']
    const index = store.workspace['x-scalar-active-tab'] ?? 0

    if (!tabs?.[index]) {
      return
    }

    // Update the current tab path to match the current route
    tabs[index] = tabsState.createTabFromCurrentRoute()
  }

  /**
   * Syncs the current route path with the active tab's path.
   * If a callback `fn` is provided, it is called if the tab's path differs from the current route.
   */
  const sync = async (fn?: (props: { tabPath: string }) => Promise<void> | void) => {
    const store = workspaceSelectorState.store.value

    if (!store) {
      // No store found, do nothing
      return
    }

    const tabs = store.workspace['x-scalar-tabs'] ?? []
    const index = store.workspace['x-scalar-active-tab'] ?? 0

    const tab = tabs[index]

    if (!tab) {
      // No active tab found, do nothing
      return
    }

    if (tab.path === route.path) {
      // Already on the correct path, do nothing
      return
    }

    // Trigger sync operation using the tab's path
    await fn?.({ tabPath: tab.path })
  }

  /**
   * Handles changing the active workspace when the workspace slug changes in the route.
   * This function:
   *  - Clears the current workspace store and sets loading state.
   *  - Attempts to load the workspace by slug.
   *    - If found, navigates to the active tab path (if available).
   *    - If not found, creates the default workspace and navigates to it.
   */
  const changeWorkspace = async (slug: string) => {
    // Clear the current store and set loading to true before loading new workspace.
    workspaceSelectorState.store.value = null
    isLoading.value = true

    // Try to load the workspace
    const result = await workspaceSelectorState.loadWorkspace(slug)

    if (result.success) {
      // Nagivate to the correct tab if the workspace has a tab already
      const { workspace: client } = result
      const index = client.workspace['x-scalar-active-tab'] ?? 0
      const tab = client.workspace['x-scalar-tabs']?.[index]

      if (tab) {
        await router.replace(tab.path)
      }

      // Initialize the tabs if they does not exist
      if (!client.workspace['x-scalar-tabs']) {
        eventBus.emit('tabs:update:tabs', {
          'x-scalar-tabs': [tabsState.createTabFromCurrentRoute()],
          'x-scalar-active-tab': 0,
        })
      }

      isLoading.value = false
      return
    }

    // If loading failed (workspace does not exist), create the default workspace and navigate to it.
    const createResult = await workspaceSelectorState.createWorkspace(DEFAULT_WORKSPACE)

    isLoading.value = false

    if (!createResult) {
      return console.error('Failed to create the default workspace, something went wrong, can not load the workspace')
    }
  }

  // Watch and respond to changes in the current route path.
  //
  // Main responsibilities:
  // - When the workspace slug (workspaceSlug) in the route changes:
  //   - Clear the current workspace store and set loading state.
  //   - Attempt to load the new workspace and navigate to its active tab, if available.
  //   - If the workspace doesn't exist, create and navigate to the default workspace.
  // - On any route path change (including browser navigation):
  //   - Update the persisted current path (for restoring on reload).
  //   - Sync the current tab state so the UI reflects the router state.
  //   - Always ensure loading state is correctly reset.
  watch(
    [() => route.path],
    async () => {
      // Persist the current path to support reload and workspace session
      workspaceStorage.setCurrentPath(route.path)

      const slug = route.params.workspaceSlug

      // If switching to a new workspace, handle loading and navigation
      if (typeof slug === 'string' && slug !== workspaceSelectorState.activeWorkspace.value?.id) {
        return await changeWorkspace(slug)
      }

      // For any route change (including in the same workspace), sync tab state with the route
      await sync(updateCurrentTabByRouterState)
      isLoading.value = false
    },
    { immediate: true },
  )

  return { isLoading }
}
