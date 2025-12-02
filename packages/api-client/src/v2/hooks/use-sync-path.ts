import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { DEFAULT_WORKSPACE, type UseWorkspaceSelectorReturn } from '@/v2/hooks/use-workspace-selector'

const LOAD_FROM_SESSION_QUERY = 'loadFromSession' as const

export const useSyncPath = ({ workspaceSelector }: { workspaceSelector: UseWorkspaceSelectorReturn }) => {
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
    const store = workspaceSelector.store.value

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
    const store = workspaceSelector.store.value

    if (!store) {
      return
    }

    const tabs = store.workspace['x-scalar-tabs']
    const index = store.workspace['x-scalar-active-tab'] ?? 0

    if (!tabs?.[index]) {
      return
    }

    tabs[index] = {
      title: 'updated',
      path: route.path,
    }
  }

  // Sync the path when the active tab changes
  watch(
    [
      () => workspaceSelector.store.value?.workspace['x-scalar-tabs'],
      () => workspaceSelector.store.value?.workspace['x-scalar-active-tab'],
      () => workspaceSelector.activeWorkspace.value?.id,
    ],
    async ([_tabs, _activeTab, workspaceId], [_newTabs, _newActiveTab, newWorkspaceId]) => {
      // When we switch workspace, we do not want to sync the path
      if (!shouldLoadFromSession() && workspaceId !== newWorkspaceId) {
        isLoading.value = false
        return
      }

      // Sync the router path with the active tab path
      await sync(async ({ tabPath }) => {
        console.log('pushing router to sync with the tab state', tabPath)
        await router.push(tabPath)
        isLoading.value = false
      })
    },
  )

  watch([() => route.path], async () => {
    const slug = route.params.workspaceSlug

    // When the worksapce changes
    if (typeof slug === 'string' && slug !== workspaceSelector.activeWorkspace.value?.id) {
      // Clear the store before we load the new wroksapce
      workspaceSelector.store.value = null
      isLoading.value = true
      console.log('loading workspace')

      // Load the workspace if the slug is different
      if (await workspaceSelector.loadWorkspace(slug)) {
        console.log('worksapce loaded', slug)
        // Sync the tab with the new path
        await sync(updateCurrentTab)
        return
      }

      // Create the default workspace and navigate to it
      await workspaceSelector.createWorkspace({ name: DEFAULT_WORKSPACE.name })

      // Navigate to the default workspace
      return await workspaceSelector.setWorkspaceId(DEFAULT_WORKSPACE.id)
    }

    // Sync the tab with the new path
    await sync(updateCurrentTab)
  })

  return {
    isLoading,
  }
}
