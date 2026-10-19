import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { describe, expect, it, vi } from 'vitest'

import { closeActiveTabOrWindow } from './close-active-tab-or-window'

describe('closeActiveTabOrWindow', () => {
  it('closes the active tab when more than one tab is open', () => {
    const eventBus = createWorkspaceEventBus()
    const onCloseTab = vi.fn()
    const closeWindow = vi.fn()
    eventBus.on('tabs:close:tab', onCloseTab)

    closeActiveTabOrWindow({ tabCount: 3, activeTabIndex: 1, eventBus, closeWindow })

    expect(onCloseTab).toHaveBeenCalledTimes(1)
    expect(onCloseTab).toHaveBeenCalledWith({ index: 1 })
    expect(closeWindow).not.toHaveBeenCalled()
  })

  it('closes the window when only one tab is open', () => {
    const eventBus = createWorkspaceEventBus()
    const onCloseTab = vi.fn()
    const closeWindow = vi.fn()
    eventBus.on('tabs:close:tab', onCloseTab)

    closeActiveTabOrWindow({ tabCount: 1, activeTabIndex: 0, eventBus, closeWindow })

    expect(closeWindow).toHaveBeenCalledTimes(1)
    expect(onCloseTab).not.toHaveBeenCalled()
  })
})
