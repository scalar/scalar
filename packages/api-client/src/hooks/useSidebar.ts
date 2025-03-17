import type { ClientLayout } from '@/hooks/useLayout'
import { type InjectionKey, inject, reactive, readonly, ref } from 'vue'

type CollapsedSidebarFolders = Record<string, boolean>

/** Creates the sidebar state so that it can be unique across instances of the client */
export const createSidebarState = ({ layout }: { layout: ClientLayout }) => {
  const collapsedSidebarFolders = reactive<CollapsedSidebarFolders>({})
  const isSidebarOpen = ref(layout !== 'modal')

  return {
    collapsedSidebarFolders,
    isSidebarOpen,
  }
}
export const SIDEBAR_SYMBOL = Symbol() as InjectionKey<ReturnType<typeof createSidebarState>>

/** Handles any logic related to sidebar */
export const useSidebar = () => {
  const sidebarState = inject(SIDEBAR_SYMBOL)
  if (!sidebarState) {
    throw new Error('useSidebar must have injected SIDEBAR_SYMBOL')
  }

  const { collapsedSidebarFolders, isSidebarOpen } = sidebarState

  /** Open or close a sidebar folder directly */
  const setCollapsedSidebarFolder = (uid: string, value: boolean) => (collapsedSidebarFolders[uid] = value)

  /** Toggle a sidebar folder open/closed */
  const toggleSidebarFolder = (key: string) => (collapsedSidebarFolders[key] = !collapsedSidebarFolders[key])

  /** Set the sidebar open/closed */
  const setSidebarOpen = (value: boolean) => (isSidebarOpen.value = value)

  /** Toggle the sidebar open/closed */
  const toggleSidebarOpen = () => (isSidebarOpen.value = !isSidebarOpen.value)

  return {
    /** State */
    collapsedSidebarFolders: readonly(collapsedSidebarFolders),
    isSidebarOpen: readonly(isSidebarOpen),

    /** Actions */
    setCollapsedSidebarFolder,
    toggleSidebarFolder,
    setSidebarOpen,
    toggleSidebarOpen,
  }
}
