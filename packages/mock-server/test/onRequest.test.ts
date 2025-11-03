import { describe, expect, it, vi } from 'vitest'

import { createMockServer } from '../src/create-mock-server'
import type { MockServerOptions } from '../src/types'

describe('onRequest', () => {
  it('call custom onRequest hook', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          get: {
            operationId: 'foobar',
          },
        },
      },
    }

    const onRequestSpy = vi.fn<NonNullable<MockServerOptions['onRequest']>>()

    const server = await createMockServer({
      specification,
      onRequest: onRequestSpy,
    })

    await server.request('/foobar')

    expect(onRequestSpy).toHaveBeenCalledOnce()

    const [{ context, operation }] = onRequestSpy.mock.lastCall!
    expect(context.req.method).toBe('GET')
    expect(context.req.path).toBe('/foobar')

    expect(operation.operationId).toBe('foobar')
  })
})
