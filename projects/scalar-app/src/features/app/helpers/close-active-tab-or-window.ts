import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

/**
 * Handles the desktop "Close Tab" shortcut (CmdOrCtrl+W) like a browser does:
 * closes the active tab, or the whole window when only one tab is left.
 *
 * The tabs mutator refuses to close the last tab, so without the window fallback
 * the shortcut would do nothing on a single tab.
 */
export const closeActiveTabOrWindow = ({
  tabCount,
  activeTabIndex,
  eventBus,
  closeWindow,
}: {
  /** Number of open tabs */
  tabCount: number
  /** Index of the tab to close */
  activeTabIndex: number
  /** Workspace event bus used to close the tab */
  eventBus: WorkspaceEventBus
  /** Closes the window hosting the app */
  closeWindow: () => void
}): void => {
  if (tabCount > 1) {
    eventBus.emit('tabs:close:tab', { index: activeTabIndex })
    return
  }

  closeWindow()
}
