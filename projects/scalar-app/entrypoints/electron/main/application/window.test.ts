import { afterEach, describe, expect, it, vi } from 'vitest'

const { openExternal, setWindowOpenHandler } = vi.hoisted(() => ({
  openExternal: vi.fn(),
  setWindowOpenHandler: vi.fn<(handler: (details: { url: string }) => { action: 'deny' | 'allow' }) => void>(),
}))

vi.mock('electron/common', () => ({ shell: { openExternal } }))
vi.mock('electron/main', () => ({
  BrowserWindow: class {
    webContents = { setWindowOpenHandler }
    on = vi.fn()
    loadFile = vi.fn()
  },
}))
vi.mock('electron-window-state', () => ({ default: () => ({ manage: vi.fn() }) }))

import { createWindow } from './window'

describe('window', () => {
  afterEach(() => vi.clearAllMocks())

  it.each([
    'file:///tmp/authorization',
    'smb://example.invalid/share',
    'javascript:void(0)//',
    'java\tscript:void(0)//',
    'data:text/html,inert',
    'custom-protocol://authorize',
    'http://auth.example.com/authorize',
    'not a url',
    '/relative',
  ])('denies %s without invoking an OS handler', (url) => {
    createWindow({})
    const handler = setWindowOpenHandler.mock.calls[0]![0]

    expect(handler({ url })).toStrictEqual({ action: 'deny' })
    expect(openExternal).not.toHaveBeenCalled()
  })

  it.each(['https://example.com/docs', 'http://localhost:3000/docs', 'http://127.0.0.1/docs'])(
    'opens %s externally and denies an Electron popup',
    (url) => {
      createWindow({})
      const handler = setWindowOpenHandler.mock.calls[0]![0]

      expect(handler({ url })).toStrictEqual({ action: 'deny' })
      expect(openExternal).toHaveBeenCalledExactlyOnceWith(url)
    },
  )
})
