import type { ClientPlugin, ResponseBodyHandler } from '@scalar/oas-utils/helpers'
import { describe, expect, it } from 'vitest'

import { resolveResponseBodyHandler } from './resolve-response-body-handler'

const makePlugin = (handler: ResponseBodyHandler): ClientPlugin => ({
  responseBody: [handler],
})

describe('resolveResponseBodyHandler', () => {
  it('returns undefined when no plugins are provided', () => {
    expect(resolveResponseBodyHandler('application/json', [])).toBeUndefined()
  })

  it('returns undefined when no handler matches', () => {
    const plugin = makePlugin({
      mimeTypes: ['application/msgpack'],
      decode: (buf) => new TextDecoder().decode(buf),
    })

    expect(resolveResponseBodyHandler('application/json', [plugin])).toBeUndefined()
  })

  it('matches an exact MIME type', () => {
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/msgpack'],
      decode: (buf) => new TextDecoder().decode(buf),
    }
    const plugin = makePlugin(handler)

    expect(resolveResponseBodyHandler('application/msgpack', [plugin])).toBe(handler)
  })

  it('matches case-insensitively', () => {
    const handler: ResponseBodyHandler = {
      mimeTypes: ['Application/MsgPack'],
      decode: (buf) => new TextDecoder().decode(buf),
    }
    const plugin = makePlugin(handler)

    expect(resolveResponseBodyHandler('application/msgpack', [plugin])).toBe(handler)
  })

  it('matches wildcard patterns', () => {
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/vnd.*+json'],
      decode: (buf) => new TextDecoder().decode(buf),
    }
    const plugin = makePlugin(handler)

    expect(resolveResponseBodyHandler('application/vnd.api+json', [plugin])).toBe(handler)
  })

  it('returns the first matching handler across plugins', () => {
    const handler1: ResponseBodyHandler = {
      mimeTypes: ['application/msgpack'],
      decode: () => 'first',
    }
    const handler2: ResponseBodyHandler = {
      mimeTypes: ['application/msgpack'],
      decode: () => 'second',
    }

    const result = resolveResponseBodyHandler('application/msgpack', [makePlugin(handler1), makePlugin(handler2)])

    expect(result).toBe(handler1)
  })

  it('skips plugins without responseBody', () => {
    const pluginWithoutHandler: ClientPlugin = {
      hooks: {
        beforeRequest: () => {},
      },
    }
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/msgpack'],
      decode: (buf) => new TextDecoder().decode(buf),
    }

    const result = resolveResponseBodyHandler('application/msgpack', [pluginWithoutHandler, makePlugin(handler)])

    expect(result).toBe(handler)
  })

  it('matches multiple mimeTypes in a single handler', () => {
    const handler: ResponseBodyHandler = {
      mimeTypes: ['application/msgpack', 'application/x-msgpack'],
      decode: (buf) => new TextDecoder().decode(buf),
    }
    const plugin = makePlugin(handler)

    expect(resolveResponseBodyHandler('application/x-msgpack', [plugin])).toBe(handler)
  })
})
