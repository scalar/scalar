import { describe, expect, it } from 'vitest'

import type { Workspace } from '@/schemas'

import {
  updateActiveEnvironment,
  updateActiveProxy,
  updateColorMode,
  updateSelectedClient,
  updateTheme,
} from './workspace'

function createWorkspace(initial?: Partial<Workspace>): Workspace {
  return {
    documents: {},
    activeDocument: undefined,
    ...initial,
  }
}

describe('updateActiveProxy', () => {
  it('does nothing when workspace is null', () => {
    updateActiveProxy(null, 'https://proxy.example.com')
    // Should not throw
  })

  it('sets x-scalar-active-proxy to a string value', () => {
    const workspace = createWorkspace()

    updateActiveProxy(workspace, 'https://proxy.example.com')

    expect(workspace['x-scalar-active-proxy']).toBe('https://proxy.example.com')
  })

  it('sets x-scalar-active-proxy to undefined when payload is null', () => {
    const workspace = createWorkspace()

    updateActiveProxy(workspace, null)

    expect(workspace['x-scalar-active-proxy']).toBeUndefined()
  })

  it('updates existing x-scalar-active-proxy value', () => {
    const workspace = createWorkspace({
      'x-scalar-active-proxy': 'https://old-proxy.example.com',
    })

    updateActiveProxy(workspace, 'https://new-proxy.example.com')

    expect(workspace['x-scalar-active-proxy']).toBe('https://new-proxy.example.com')
  })

  it('clears x-scalar-active-proxy when setting to null', () => {
    const workspace = createWorkspace({
      'x-scalar-active-proxy': 'https://existing-proxy.example.com',
    })

    updateActiveProxy(workspace, null)

    expect(workspace['x-scalar-active-proxy']).toBeUndefined()
  })

  it('updates multiple times correctly', () => {
    const workspace = createWorkspace()

    updateActiveProxy(workspace, 'https://proxy1.example.com')
    expect(workspace['x-scalar-active-proxy']).toBe('https://proxy1.example.com')

    updateActiveProxy(workspace, 'https://proxy2.example.com')
    expect(workspace['x-scalar-active-proxy']).toBe('https://proxy2.example.com')

    updateActiveProxy(workspace, null)
    expect(workspace['x-scalar-active-proxy']).toBeUndefined()

    updateActiveProxy(workspace, 'https://proxy3.example.com')
    expect(workspace['x-scalar-active-proxy']).toBe('https://proxy3.example.com')
  })

  it('handles empty string proxy URL', () => {
    const workspace = createWorkspace()

    updateActiveProxy(workspace, '')

    expect(workspace['x-scalar-active-proxy']).toBe('')
  })
})

describe('updateColorMode', () => {
  it('does nothing when workspace is null', () => {
    updateColorMode(null, 'dark')
    // Should not throw
  })

  it('sets x-scalar-color-mode to system', () => {
    const workspace = createWorkspace()

    updateColorMode(workspace, 'system')

    expect(workspace['x-scalar-color-mode']).toBe('system')
  })

  it('sets x-scalar-color-mode to light', () => {
    const workspace = createWorkspace()

    updateColorMode(workspace, 'light')

    expect(workspace['x-scalar-color-mode']).toBe('light')
  })

  it('sets x-scalar-color-mode to dark', () => {
    const workspace = createWorkspace()

    updateColorMode(workspace, 'dark')

    expect(workspace['x-scalar-color-mode']).toBe('dark')
  })

  it('updates existing x-scalar-color-mode value', () => {
    const workspace = createWorkspace({
      'x-scalar-color-mode': 'light',
    })

    updateColorMode(workspace, 'dark')

    expect(workspace['x-scalar-color-mode']).toBe('dark')
  })

  it('updates from system to light', () => {
    const workspace = createWorkspace({
      'x-scalar-color-mode': 'system',
    })

    updateColorMode(workspace, 'light')

    expect(workspace['x-scalar-color-mode']).toBe('light')
  })

  it('updates from dark to system', () => {
    const workspace = createWorkspace({
      'x-scalar-color-mode': 'dark',
    })

    updateColorMode(workspace, 'system')

    expect(workspace['x-scalar-color-mode']).toBe('system')
  })

  it('updates multiple times correctly', () => {
    const workspace = createWorkspace()

    updateColorMode(workspace, 'system')
    expect(workspace['x-scalar-color-mode']).toBe('system')

    updateColorMode(workspace, 'light')
    expect(workspace['x-scalar-color-mode']).toBe('light')

    updateColorMode(workspace, 'dark')
    expect(workspace['x-scalar-color-mode']).toBe('dark')

    updateColorMode(workspace, 'system')
    expect(workspace['x-scalar-color-mode']).toBe('system')
  })
})

describe('updateTheme', () => {
  it('does nothing when workspace is null', () => {
    updateTheme(null, 'default')
    // Should not throw
  })

  it('sets x-scalar-theme to default', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'default')

    expect(workspace['x-scalar-theme']).toBe('default')
  })

  it('sets x-scalar-theme to alternate', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'alternate')

    expect(workspace['x-scalar-theme']).toBe('alternate')
  })

  it('sets x-scalar-theme to purple', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'purple')

    expect(workspace['x-scalar-theme']).toBe('purple')
  })

  it('sets x-scalar-theme to solarized', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'solarized')

    expect(workspace['x-scalar-theme']).toBe('solarized')
  })

  it('sets x-scalar-theme to saturn', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'saturn')

    expect(workspace['x-scalar-theme']).toBe('saturn')
  })

  it('sets x-scalar-theme to kepler', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'kepler')

    expect(workspace['x-scalar-theme']).toBe('kepler')
  })

  it('updates existing x-scalar-theme value', () => {
    const workspace = createWorkspace({
      'x-scalar-theme': 'default',
    })

    updateTheme(workspace, 'purple')

    expect(workspace['x-scalar-theme']).toBe('purple')
  })

  it('updates multiple times correctly', () => {
    const workspace = createWorkspace()

    updateTheme(workspace, 'default')
    expect(workspace['x-scalar-theme']).toBe('default')

    updateTheme(workspace, 'purple')
    expect(workspace['x-scalar-theme']).toBe('purple')

    updateTheme(workspace, 'solarized')
    expect(workspace['x-scalar-theme']).toBe('solarized')

    updateTheme(workspace, 'alternate')
    expect(workspace['x-scalar-theme']).toBe('alternate')
  })

  it('preserves other workspace properties', () => {
    const workspace = createWorkspace({
      documents: {
        'doc-1': {
          openapi: '3.1.0',
          info: { title: 'Doc 1', version: '1.0.0' },
          'x-scalar-original-document-hash': 'hash1',
        },
      },
      'x-scalar-color-mode': 'dark',
      'x-scalar-theme': 'default',
    })

    updateTheme(workspace, 'purple')

    expect(workspace.documents).toHaveProperty('doc-1')
    expect(workspace['x-scalar-color-mode']).toBe('dark')
    expect(workspace['x-scalar-theme']).toBe('purple')
  })
})

describe('updateSelectedClient', () => {
  it('does nothing when workspace is null', () => {
    updateSelectedClient(null, 'shell/curl')
    // Should not throw
  })

  it('sets x-scalar-default-client to a client identifier', () => {
    const workspace = createWorkspace()

    updateSelectedClient(workspace, 'js/fetch')

    expect(workspace['x-scalar-default-client']).toBe('js/fetch')
  })
})

describe('updateActiveEnvironment', () => {
  it('does nothing when workspace is null', () => {
    updateActiveEnvironment(null, 'production')
    // Should not throw
  })

  it('sets x-scalar-active-environment to an environment name', () => {
    const workspace = createWorkspace()

    updateActiveEnvironment(workspace, 'production')

    expect(workspace['x-scalar-active-environment']).toBe('production')
  })

  it('sets x-scalar-active-environment to undefined when payload is null', () => {
    const workspace = createWorkspace()

    updateActiveEnvironment(workspace, null)

    expect(workspace['x-scalar-active-environment']).toBeUndefined()
  })

  it('updates existing x-scalar-active-environment value', () => {
    const workspace = createWorkspace({
      'x-scalar-active-environment': 'development',
    })

    updateActiveEnvironment(workspace, 'production')

    expect(workspace['x-scalar-active-environment']).toBe('production')
  })

  it('clears x-scalar-active-environment when setting to null', () => {
    const workspace = createWorkspace({
      'x-scalar-active-environment': 'staging',
    })

    updateActiveEnvironment(workspace, null)

    expect(workspace['x-scalar-active-environment']).toBeUndefined()
  })
})
