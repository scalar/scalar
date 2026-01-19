import type { TabEvents } from '@/events/definitions/tabs'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { Workspace } from '@/schemas'

/**
 * Depth level for unpacking tab proxy objects.
 * We only need shallow unpacking since tabs are a flat array.
 */
const TAB_UNPACK_DEPTH = 1

/**
 * Helper to validate that workspace has tabs configured.
 * Returns false if workspace or tabs are not available.
 */
const hasValidTabs = (
  workspace: Workspace | null,
): workspace is Workspace & { 'x-scalar-tabs': NonNullable<Workspace['x-scalar-tabs']> } => {
  return workspace !== null && workspace['x-scalar-tabs'] !== undefined
}

/**
 * Helper to get the unpacked tabs array from workspace.
 * Returns the tabs as a plain array, not a proxy.
 */
const getUnpackedTabs = (
  workspace: Workspace & { 'x-scalar-tabs': NonNullable<Workspace['x-scalar-tabs']> },
): ReturnType<typeof unpackProxyObject<NonNullable<Workspace['x-scalar-tabs']>>> => {
  return unpackProxyObject(workspace['x-scalar-tabs']!, { depth: TAB_UNPACK_DEPTH })
}

/**
 * Helper to get the current active tab index.
 * Defaults to 0 if not set.
 */
const getActiveIndex = (workspace: Workspace): number => {
  return workspace['x-scalar-active-tab'] ?? 0
}

/**
 * Updates the tabs and active tab index in the workspace.
 * This is used for bulk updates when synchronizing state.
 */
export const updateTabs = (workspace: Workspace | null, payload: TabEvents['tabs:update:tabs']): void => {
  if (!workspace) {
    return
  }

  if (payload['x-scalar-tabs']) {
    workspace['x-scalar-tabs'] = payload['x-scalar-tabs']
  }

  if (payload['x-scalar-active-tab'] !== undefined) {
    workspace['x-scalar-active-tab'] = payload['x-scalar-active-tab']
  }
}

/**
 * Adds a new tab by duplicating the currently active tab.
 * This preserves the user's context when opening a new tab.
 */
export const addTab = (workspace: Workspace | null, _payload: TabEvents['tabs:add:tab']): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const tabs = getUnpackedTabs(workspace)
  const activeIndex = getActiveIndex(workspace)
  const currentTab = tabs[activeIndex]

  if (!currentTab) {
    return false
  }

  const newTabs = [...tabs, { ...currentTab }]

  workspace['x-scalar-tabs'] = newTabs
  workspace['x-scalar-active-tab'] = newTabs.length - 1
  return true
}

/**
 * Closes the currently active tab.
 * Prevents closing if only one tab remains, to ensure the user always has a tab open.
 * Adjusts the active index if needed to keep it in bounds.
 */
export const closeTab = (workspace: Workspace | null, payload: TabEvents['tabs:close:tab']): boolean => {
  const getInputIndex = (): number => {
    if ('event' in payload) {
      return payload.event.code.startsWith('Digit') ? Number.parseInt(payload.event.key, 10) - 1 : Number.NaN
    }
    return payload.index
  }

  if (!hasValidTabs(workspace)) {
    return false
  }

  const index = getInputIndex()
  const filteredTabs = getUnpackedTabs(workspace).filter((_, i) => i !== index)

  if (filteredTabs.length <= 0) {
    return false
  }

  workspace['x-scalar-tabs'] = filteredTabs

  /**
   * If we closed a tab at the end, the active index needs to move back.
   * This ensures the active tab stays within bounds after removal.
   */
  if (index >= filteredTabs.length) {
    workspace['x-scalar-active-tab'] = filteredTabs.length - 1
  }

  return true
}

/**
 * Closes all other tabs except the one at the given index
 */
export const closeOtherTabs = (workspace: Workspace | null, payload: TabEvents['tabs:close:other-tabs']): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const tabs = getUnpackedTabs(workspace)

  if (tabs.length <= 1) {
    return false
  }

  workspace['x-scalar-tabs'] = tabs.filter((_, index) => index === payload.index)
  // set the active tab to the first tab since we closed all other tabs
  workspace['x-scalar-active-tab'] = 0
  return true
}

/**
 * Navigates to the previous tab in the list.
 * Does nothing if already at the first tab.
 */
export const navigatePreviousTab = (
  workspace: Workspace | null,
  _payload: TabEvents['tabs:navigate:previous'],
): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const activeIndex = getActiveIndex(workspace)

  if (activeIndex <= 0) {
    return false
  }

  workspace['x-scalar-active-tab'] = activeIndex - 1
  return true
}

/**
 * Navigates to the next tab in the list.
 * Does nothing if already at the last tab.
 */
export const navigateNextTab = (workspace: Workspace | null, _payload: TabEvents['tabs:navigate:next']): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const tabs = getUnpackedTabs(workspace)
  const activeIndex = getActiveIndex(workspace)

  if (activeIndex >= tabs.length - 1) {
    return false
  }

  workspace['x-scalar-active-tab'] = activeIndex + 1
  return true
}

/**
 * Focuses a specific tab based on keyboard number input (1-9).
 * Extracts the digit from the keyboard event and focuses that tab.
 * Tab numbering starts at 1 for user convenience but uses 0-based indexing internally.
 */
export const focusTab = (workspace: Workspace | null, payload: TabEvents['tabs:focus:tab']): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const getInputIndex = (): number => {
    if ('event' in payload) {
      return payload.event.code.startsWith('Digit') ? Number.parseInt(payload.event.key, 10) - 1 : Number.NaN
    }
    return payload.index
  }

  const tabs = getUnpackedTabs(workspace)

  const newActiveIndex = getInputIndex()

  if (Number.isNaN(newActiveIndex) || newActiveIndex < 0 || newActiveIndex >= tabs.length) {
    return false
  }

  workspace['x-scalar-active-tab'] = newActiveIndex
  return true
}

/**
 * Focuses the last tab in the list.
 * This provides a quick way to jump to the end, regardless of how many tabs exist.
 */
export const focusLastTab = (workspace: Workspace | null, _payload: TabEvents['tabs:focus:tab-last']): boolean => {
  if (!hasValidTabs(workspace)) {
    return false
  }

  const tabs = getUnpackedTabs(workspace)

  if (tabs.length <= 1) {
    return false
  }

  workspace['x-scalar-active-tab'] = tabs.length - 1
  return true
}

export const tabsMutatorsFactory = ({ workspace }: { workspace: Workspace | null }) => {
  return {
    updateTabs: (payload: TabEvents['tabs:update:tabs']) => updateTabs(workspace, payload),
    addTab: (payload: TabEvents['tabs:add:tab']) => addTab(workspace, payload),
    closeTab: (payload: TabEvents['tabs:close:tab']) => closeTab(workspace, payload),
    closeOtherTabs: (payload: TabEvents['tabs:close:other-tabs']) => closeOtherTabs(workspace, payload),
    navigatePreviousTab: (payload: TabEvents['tabs:navigate:previous']) => navigatePreviousTab(workspace, payload),
    navigateNextTab: (payload: TabEvents['tabs:navigate:next']) => navigateNextTab(workspace, payload),
    focusTab: (payload: TabEvents['tabs:focus:tab']) => focusTab(workspace, payload),
    focusLastTab: (payload: TabEvents['tabs:focus:tab-last']) => focusLastTab(workspace, payload),
  }
}
