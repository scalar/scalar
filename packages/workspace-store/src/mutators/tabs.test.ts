import { describe, expect, it } from 'vitest'

import type { Workspace } from '@/schemas'
import type { Tab } from '@/schemas/extensions/workspace/x-scalar-tabs'

import {
  addTab,
  closeOtherTabs,
  closeTab,
  focusLastTab,
  focusTab,
  navigateNextTab,
  navigatePreviousTab,
  updateTabs,
} from './tabs'

function createWorkspace(initial?: Partial<Workspace>): Workspace {
  return {
    documents: {},
    activeDocument: undefined,
    ...initial,
  }
}

function createTab(overrides?: Partial<Tab>): Tab {
  return {
    path: '/users',
    title: 'Test Tab',
    icon: 'request',
    ...overrides,
  }
}

describe('updateTabs', () => {
  it('does nothing when workspace is null', () => {
    updateTabs(null, {
      'x-scalar-tabs': [createTab()],
      'x-scalar-active-tab': 0,
    })
    // Should not throw
  })

  it('updates tabs and active tab index', () => {
    const workspace = createWorkspace()

    const tabs = [createTab({ path: '/users', title: 'Users' }), createTab({ path: '/posts', title: 'Posts' })]

    updateTabs(workspace, {
      'x-scalar-tabs': tabs,
      'x-scalar-active-tab': 1,
    })

    expect(workspace['x-scalar-tabs']).toEqual(tabs)
    expect(workspace['x-scalar-active-tab']).toBe(1)
  })
})

describe('addTab', () => {
  it('returns false when workspace has no tabs', () => {
    const workspace = createWorkspace()

    const result = addTab(workspace, undefined)

    expect(result).toBe(false)
  })

  it('duplicates the current active tab and focuses the new tab', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' }), createTab({ path: '/posts', title: 'Posts' })],
      'x-scalar-active-tab': 1,
    })

    const result = addTab(workspace, undefined)

    expect(result).toBe(true)
    expect(workspace['x-scalar-tabs']).toHaveLength(3)
    expect(workspace['x-scalar-tabs']?.[2]).toEqual({ path: '/posts', title: 'Posts', icon: 'request' })
    expect(workspace['x-scalar-active-tab']).toBe(2)
  })
})

describe('closeTab', () => {
  it('returns false when only one tab remains', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' })],
      'x-scalar-active-tab': 0,
    })

    const result = closeTab(workspace, { index: 0 })

    expect(result).toBe(false)
    expect(workspace['x-scalar-tabs']).toHaveLength(1)
  })

  it('closes the tab at the specified index and adjusts active index', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 2,
    })

    const result = closeTab(workspace, { index: 2 })

    expect(result).toBe(true)
    expect(workspace['x-scalar-tabs']).toHaveLength(2)
    expect(workspace['x-scalar-active-tab']).toBe(1)
  })
})

describe('closeOtherTabs', () => {
  it('returns false when only one tab exists', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' })],
      'x-scalar-active-tab': 0,
    })

    const result = closeOtherTabs(workspace, { index: 0 })

    expect(result).toBe(false)
  })

  it('closes all tabs except the specified one and sets active to 0', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 2,
    })

    const result = closeOtherTabs(workspace, { index: 1 })

    expect(result).toBe(true)
    expect(workspace['x-scalar-tabs']).toHaveLength(1)
    expect(workspace['x-scalar-tabs']?.[0]).toEqual({ path: '/posts', title: 'Posts', icon: 'request' })
    expect(workspace['x-scalar-active-tab']).toBe(0)
  })
})

describe('navigatePreviousTab', () => {
  it('returns false when already at the first tab', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' }), createTab({ path: '/posts', title: 'Posts' })],
      'x-scalar-active-tab': 0,
    })

    const result = navigatePreviousTab(workspace, undefined)

    expect(result).toBe(false)
    expect(workspace['x-scalar-active-tab']).toBe(0)
  })

  it('moves to the previous tab', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 2,
    })

    const result = navigatePreviousTab(workspace, undefined)

    expect(result).toBe(true)
    expect(workspace['x-scalar-active-tab']).toBe(1)
  })
})

describe('navigateNextTab', () => {
  it('returns false when already at the last tab', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' }), createTab({ path: '/posts', title: 'Posts' })],
      'x-scalar-active-tab': 1,
    })

    const result = navigateNextTab(workspace, undefined)

    expect(result).toBe(false)
    expect(workspace['x-scalar-active-tab']).toBe(1)
  })

  it('moves to the next tab', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 0,
    })

    const result = navigateNextTab(workspace, undefined)

    expect(result).toBe(true)
    expect(workspace['x-scalar-active-tab']).toBe(1)
  })
})

describe('focusTab', () => {
  it('returns false when index is out of bounds', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' }), createTab({ path: '/posts', title: 'Posts' })],
      'x-scalar-active-tab': 0,
    })

    const result = focusTab(workspace, { index: 5 })

    expect(result).toBe(false)
    expect(workspace['x-scalar-active-tab']).toBe(0)
  })

  it('focuses the tab at the specified index', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 0,
    })

    const result = focusTab(workspace, { index: 2 })

    expect(result).toBe(true)
    expect(workspace['x-scalar-active-tab']).toBe(2)
  })
})

describe('focusLastTab', () => {
  it('returns false when only one tab exists', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [createTab({ path: '/users', title: 'Users' })],
      'x-scalar-active-tab': 0,
    })

    const result = focusLastTab(workspace, undefined)

    expect(result).toBe(false)
  })

  it('focuses the last tab in the list', () => {
    const workspace = createWorkspace({
      'x-scalar-tabs': [
        createTab({ path: '/users', title: 'Users' }),
        createTab({ path: '/posts', title: 'Posts' }),
        createTab({ path: '/comments', title: 'Comments' }),
      ],
      'x-scalar-active-tab': 0,
    })

    const result = focusLastTab(workspace, undefined)

    expect(result).toBe(true)
    expect(workspace['x-scalar-active-tab']).toBe(2)
  })
})
