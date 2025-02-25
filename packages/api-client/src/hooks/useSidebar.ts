import type { ClientLayout } from '@/hooks/useLayout'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { type InjectionKey, inject, reactive, readonly, ref, watch } from 'vue'

type CollapsedSidebarFolders = Record<string, boolean>

/** Creates the sidebar state so that it can be unique across instances of the client */
export const createSidebarState = ({ layout }: { layout: ClientLayout }) => {
  const collapsedSidebarFolders = reactive<CollapsedSidebarFolders>({})
  const isSidebarOpen = ref(layout !== 'modal')

  return {
    collapsedSidebarFolders,
    isSidebarOpen,
    layout,
  }
}
export const SIDEBAR_SYMBOL = Symbol() as InjectionKey<ReturnType<typeof createSidebarState>>

const { mediaQueries } = useBreakpoints()

/** Handles any logic related to sidebar */
export const useSidebar = () => {
  const sidebarState = inject(SIDEBAR_SYMBOL)
  if (!sidebarState) throw new Error('useSidebar must have injected SIDEBAR_SYMBOL')

  const { collapsedSidebarFolders, isSidebarOpen, layout } = sidebarState

  /** Open or close a sidebar folder directly */
  const setCollapsedSidebarFolder = (uid: string, value: boolean) => (collapsedSidebarFolders[uid] = value)

  /** Toggle a sidebar folder open/closed */
  const toggleSidebarFolder = (key: string) => {
    collapsedSidebarFolders[key] = !collapsedSidebarFolders[key]
  }

  /** Toggle the sidebar open/closed */
  const toggleSidebarOpen = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  // Single watcher instance for handling responsive behavior
  watch(mediaQueries.xl, (isXL) => (isSidebarOpen.value = isXL), {
    immediate: layout !== 'modal',
  })

  return {
    /** State */
    collapsedSidebarFolders: readonly(collapsedSidebarFolders),
    isSidebarOpen: readonly(isSidebarOpen),

    /** Actions */
    setCollapsedSidebarFolder,
    toggleSidebarFolder,
    toggleSidebarOpen,
  }
}
