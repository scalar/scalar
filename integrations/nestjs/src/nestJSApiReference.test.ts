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
})
