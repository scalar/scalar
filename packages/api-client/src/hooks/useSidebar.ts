import { reactive } from 'vue'

type CollapsedSidebarFolders = Record<string, boolean>

/** For opening/closing sidebar folders */
const collapsedSidebarFolders = reactive<CollapsedSidebarFolders>({})

/**
 * For opening/closing sidebar items
 * We can be nested any number of folders so need a way to track where we are
 */
const setCollapsedSidebarFolder = (uid: string, value: boolean) => (collapsedSidebarFolders[uid] = value)

/** Toggle a sidebar folder open/closed */
const toggleSidebarFolder = (key: string) => {
  collapsedSidebarFolders[key] = !collapsedSidebarFolders[key]
}

/** Handles any logic related to sidebar */
export const useSidebar = () => ({
  collapsedSidebarFolders,
  setCollapsedSidebarFolder,
  toggleSidebarFolder,
})
