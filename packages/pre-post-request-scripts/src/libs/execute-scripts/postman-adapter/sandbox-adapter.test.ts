// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { sandboxFrameUrl, toPostmanResponse } from './sandbox-adapter'

describe('sandbox-adapter', () => {
  it('serializes a Response into a Postman response definition with header objects', async () => {
    const response = new Response('{"ok":true}', {
      status: 201,
      statusText: 'Created',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-123',
      },
    })

    const result = await toPostmanResponse(response)

    expect(result.code).toBe(201)
    expect(result.status).toBe('Created')
    expect(result.header).toEqual(
      expect.arrayContaining([
        { key: 'content-type', value: 'application/json' },
        { key: 'x-request-id', value: 'req-123' },
      ]),
    )
    expect(result.stream).toEqual({ type: 'Buffer', data: Array.from(new TextEncoder().encode('{"ok":true}')) })
  })

  it('falls back to the numeric status when statusText is empty', async () => {
    const result = await toPostmanResponse(new Response(null, { status: 204 }))
    expect(result.status).toBe('204')
  })

  it('rejects when the response body cannot be read', async () => {
    const response = new Response('payload', { status: 200 })
    response.arrayBuffer = () => Promise.reject(new Error('Body already used'))

    await expect(toPostmanResponse(response)).rejects.toThrow('Body already used')
  })

  it('preserves binary payloads byte-for-byte', async () => {
    // PDF magic bytes (0x25 0x50 0x44 0x46 … “%PDF”) followed by a byte sequence that is not
    // valid UTF-8 (0xC0 is never a valid lead byte). Round-tripping through `response.text()` +
    // `TextEncoder` would replace 0xC0 with the U+FFFD replacement character and corrupt the
    // signature; `arrayBuffer()` must keep every byte intact.
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xc0, 0x80, 0xff, 0x00])
    const response = new Response(bytes, { status: 200 })

    const result = await toPostmanResponse(response)

    expect(result.stream).toEqual({ type: 'Buffer', data: Array.from(bytes) })
  })
})

describe('sandboxFrameUrl', () => {
  // `isElectron()` checks for `window.electron` (preload-injected). Tests drive that flag plus
  // `window.location`/`<base href>` to simulate each environment.
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location')

  const stubLocation = (href: string) => {
    const url = new URL(href)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      },
    })
    // jsdom mirrors `document.baseURI` from `<base href>`, so update one to match.
    let base = document.querySelector('base')
    if (!base) {
      base = document.createElement('base')
      document.head.appendChild(base)
    }
    base.href = href
  }

  const setElectron = (present: boolean) => {
    if (present) {
      ;(window as unknown as { electron?: boolean }).electron = true
    } else {
      delete (window as unknown as { electron?: boolean }).electron
    }
  }

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor)
    }
    document.querySelector('base')?.remove()
    setElectron(false)
  })

  it('anchors to the origin root on the web so SPA route segments do not break resolution', () => {
    // Relative URLs would land under the active SPA route and hit the history fallback.
    setElectron(false)
    stubLocation('https://client.scalar.com/@team/workspace/get-started')

    expect(sandboxFrameUrl()).toBe('https://client.scalar.com/sandbox.html')
  })

  it('keeps the origin-root anchor on the web at the application root', () => {
    setElectron(false)
    stubLocation('https://client.scalar.com/')

    expect(sandboxFrameUrl()).toBe('https://client.scalar.com/sandbox.html')
  })

  it('resolves a sibling in packaged Electron (`file://`)', () => {
    // The document path is literal on disk; the `file://` origin alone would drop the directory.
    setElectron(true)
    stubLocation('file:///Applications/Scalar.app/Contents/Resources/renderer/index.html')

    expect(sandboxFrameUrl()).toBe('file:///Applications/Scalar.app/Contents/Resources/renderer/sandbox.html')
  })

  it('resolves a sibling in Electron dev mode where the renderer is served over http(s)', () => {
    // Dev-mode Electron looks like a web URL; only `window.electron` distinguishes it.
    setElectron(true)
    stubLocation('http://localhost:5066/')

    expect(sandboxFrameUrl()).toBe('http://localhost:5066/sandbox.html')
  })
})
