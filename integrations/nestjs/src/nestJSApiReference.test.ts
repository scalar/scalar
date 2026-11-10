import { createServer } from 'node:http'
import { runInNewContext } from 'node:vm'

import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createTestApp } from '../test/app.factory'
import { apiReference } from './nestJSApiReference'
import type { NestJSReferenceConfiguration } from './types'

describe('nestJSApiReference', () => {
  it.each([
    { withFastify: false, bundle: true },
    { withFastify: false, bundle: false },
    { withFastify: true, bundle: true },
    { withFastify: true, bundle: false },
  ])('preserves browser plugin URLs (Fastify: $withFastify, ESM: $bundle)', async ({ withFastify, bundle }) => {
    const app = await createTestApp({ fastify: withFastify })
    const pluginUrls = ['/plugins/custom-extension.js', 'https://example.com/plugin.js?version=1&format=esm']

    try {
      app.use('/reference', apiReference({ pluginUrls, withFastify, bundle }))
      await app.listen(0)

      const response = await request(app.getHttpServer()).get('/reference')
      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')

      const script = response.text.match(/<script type="(?:module|text\/javascript)">([\s\S]*?)<\/script>/)?.[1]
      expect(typeof script).toBe('string')

      const configurations: Pick<NestJSReferenceConfiguration, 'pluginUrls'>[] = []
      const capture = (_selector: string, configuration: NestJSReferenceConfiguration): void => {
        configurations.push({ pluginUrls: configuration.pluginUrls ? [...configuration.pluginUrls] : undefined })
      }
      runInNewContext((script ?? '').replace(/^\s*import .*$/m, ''), {
        createApiReference: capture,
        Scalar: { createApiReference: capture },
      })

      expect(configurations).toStrictEqual([{ pluginUrls }])
    } finally {
      await app.close()
    }
  })

  it('sets the HTML content type when the adapter sends strings as plain text', async () => {
    const handler = apiReference({})
    // Mimics @nestjs/platform-node, whose send() defaults strings to text/plain
    const server = createServer((req, res) => {
      const response = Object.assign(res, {
        type: (type: string) => response.setHeader('Content-Type', type),
        send: (body: string) => {
          if (!response.hasHeader('Content-Type')) {
            response.setHeader('Content-Type', 'text/plain; charset=utf-8')
          }
          return response.end(body)
        },
      })
      handler(req as never, response as never)
    })

    const response = await request(server).get('/reference')
    expect(response.status).toBe(200)
    expect(response.type).toBe('text/html')
  })
})
