import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_QUERIES } from '@/v2/features/app/helpers/routes'
import { DEFAULT_WORKSPACE, type UseWorkspaceSelectorReturn } from '@/v2/hooks/use-workspace-selector'

import type { UseTabsReturn } from './use-tabs'

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
    return route.query[ROUTE_QUERIES.LOAD_FROM_SESSION] === 'true'
  }

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

  // Watch for changes in tabs, active tab, or workspace ID to sync route path with current active tab.
  // If the workspace is switched (and not loading from session), this will skip syncing.
  // Otherwise, will update the route to match the active tab's path.
  watch(
    [
      () => workspaceSelectorState.store.value?.workspace['x-scalar-tabs'],
      () => workspaceSelectorState.store.value?.workspace['x-scalar-active-tab'],
      // Detect if we are loading/switching workspaces
      () => workspaceSelectorState.activeWorkspace.value?.id,
    ],
    async ([_tabs, _activeTab, workspaceId], [_newTabs, _newActiveTab, newWorkspaceId]) => {
      // When we switch workspace, we do not want to sync the path
      // Unless we are loading from session
      if (!shouldLoadFromSession() && workspaceId !== newWorkspaceId) {
        isLoading.value = false
        return
      }

      // Sync the router path with the active tab path
      await sync(async ({ tabPath }) => {
        await router.push(tabPath)
      })

      isLoading.value = false
    },
    { immediate: true },
  )

  // Watch for changes to the current route's path.
  // This ensures that when the route changes (including via browser navigation),
  // the workspace store is synced/refreshed appropriately.
  // If switching to a different workspace (workspaceSlug changed), it will:
  //   - Clear the current workspace store to indicate loading state.
  //   - Attempt to load the new workspace; if successful and not restoring session, sync tabs to the route.
  //   - If workspace doesn't exist, create the default workspace.
  // If route path changes within the same workspace, and not restoring session, sync current tab to the new route path.
  watch(
    [() => route.path],
    async () => {
      const slug = route.params.workspaceSlug

      // Detect a workspace change by checking the route's workspaceSlug vs. active workspace ID.
      if (typeof slug === 'string' && slug !== workspaceSelectorState.activeWorkspace.value?.id) {
        // Clear the current store and set loading to true before loading new workspace.
        workspaceSelectorState.store.value = null
        isLoading.value = true

        // Attempt to load the workspace specified by the new slug.
        if (await workspaceSelectorState.loadWorkspace(slug)) {
          // If restoring from session, do not resync tabs, just return.
          if (shouldLoadFromSession()) {
            return
          }

          // Otherwise, sync the active tab to the current route.
          await sync(updateCurrentTabByRouterState)
          return
        }

        // If loading failed (workspace does not exist), create the default workspace and navigate to it.
        const result = await workspaceSelectorState.createWorkspace(DEFAULT_WORKSPACE)

        if (!result) {
          return console.error(
            'Failed to create the default workspace, something went wrong, can not load the workspace',
          )
        }
      }

      // If restoring from session, do not sync tabs (route will be restored elsewhere).
      if (shouldLoadFromSession()) {
        return
      }

      // For normal route path changes, sync the current tab state to match the router.
      await sync(updateCurrentTabByRouterState)
    },
    { immediate: true },
  )

  return {
    isLoading,
  }
}
