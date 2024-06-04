import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import { reactive } from 'vue'

type CollapsedSidebarFolders = Record<string, boolean>

/** For opening/closing sidebar folders */
const collapsedSidebarFolders = reactive<CollapsedSidebarFolders>({})

/**
 * Find nested request inside a collection of folders and return the folder uids
 */
const findRequestFolders = (
  requestUid: string,
  collection: Collection,
  foldersToOpen: string[] = [],
): string[] => {
  if (collection.children.includes(requestUid)) return foldersToOpen

  const folder = Object.values(collection.folders).find(({ children }) =>
    children.includes(requestUid),
  )

  if (folder) {
    return findRequestFolders(folder.uid, collection, [
      ...foldersToOpen,
      folder.uid,
    ])
  } else return foldersToOpen
}

/**
 * Opens all sidebar folders for a request in a collection
 */
const openFoldersForRequest = (requestUid: string, collection: Collection) =>
  findRequestFolders(requestUid, collection, [collection.uid]).forEach((uid) =>
    setCollapsedSidebarFolder(uid, true),
  )

/**
 * For opening/closing sidebar items
 * We can be nested any number of folders so need a way to track where we are
 */
const setCollapsedSidebarFolder = (uid: string, value: boolean) =>
  (collapsedSidebarFolders[uid] = value)

/**
 * Toggle a sidebar folder open/closed
 */
const toggleSidebarFolder = (key: string) => {
  collapsedSidebarFolders[key] = !collapsedSidebarFolders[key]
}

/**
 * Handles any logic related to sidebar
 */
export const useSidebar = () => ({
  collapsedSidebarFolders,
  openFoldersForRequest,
  setCollapsedSidebarFolder,
  toggleSidebarFolder,
})
