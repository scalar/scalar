import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getRaw } from '@scalar/json-magic/magic-proxy'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { describe, expect, it } from 'vitest'

import { processOpenApiDocument } from './process-openapi-document'

describe('process-openapi-document', () => {
  it.each(['2.0', '3.0.4', '3.1.2', '3.2.0'])('processes an OpenAPI %s document as 3.2', async (version) => {
    const result = await processOpenApiDocument({
      ...(version === '2.0' ? { swagger: version } : { openapi: version }),
      info: { title: 'Pets', version: '1.0.0' },
      paths: { '/pets': { get: { responses: { '200': { description: 'Pets' } } } } },
    })

    expect(result.openapi).toBe('3.2.0')
    expect(result.paths?.['/pets']?.get?.responses?.['200']).toMatchObject({ description: 'Pets' })
  })

  it.each([undefined, {}])('creates an OpenAPI 3.2 default for empty input %j', async (input) => {
    const result = await processOpenApiDocument(input)
    expect(result).toEqual({ openapi: '3.2.0', info: { title: 'Mock API', version: '1.0.0' }, paths: {} })
  })

  it('retains native OpenAPI 3.2 fields', async () => {
    const operation = { responses: { '200': { description: 'Search results' } } }
    const result = await processOpenApiDocument({
      openapi: '3.2.0',
      info: { title: 'Search', version: '1.0.0' },
      paths: { '/search': { query: operation } },
      tags: [{ name: 'search', summary: 'Search APIs', kind: 'nav' }],
    })
    expect(result.paths?.['/search']?.query).toEqual(operation)
    expect(result.tags).toEqual([{ name: 'search', summary: 'Search APIs', kind: 'nav' }])
  })

  it('upgrades bundled schemas and keeps recursive references lazy', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mock-upgrade-'))
    try {
      const file = join(directory, 'openapi.json')
      await writeFile(
        file,
        JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Pets', version: '1.0.0' },
          paths: {},
          components: { schemas: { Pet: { $ref: './pet.json' } } },
        }),
      )
      await writeFile(
        join(directory, 'pet.json'),
        JSON.stringify({
          type: 'object',
          properties: { id: { type: 'string', xml: { attribute: true } }, friend: { $ref: '#' } },
        }),
      )
      const result = await processOpenApiDocument(file)
      const pet = getResolvedRef(result.components?.schemas?.Pet)
      expect(result.openapi).toBe('3.2.0')
      expect(pet).toMatchObject({
        properties: { id: { xml: { nodeType: 'attribute' } }, friend: { $ref: expect.any(String) } },
      })
      expect(getResolvedRef(pet?.properties?.friend)?.properties?.id).toMatchObject({ xml: { nodeType: 'attribute' } })
      expect(() => JSON.stringify(getRaw(result))).not.toThrow()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('does not request loopback URLs through a $ref', async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(request.url ?? '')
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ secret: 'internal-service-secret' }))
    })

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })

    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address')
      }

      const document = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: { schemas: { Leaked: { $ref: `http://127.0.0.1:${address.port}/secret.json` } } },
      }

      const result = await processOpenApiDocument(document)

      expect(requests).toStrictEqual([])
      expect(JSON.stringify(result)).not.toContain('internal-service-secret')
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it('does not read files outside the working directory through a $ref', async () => {
    const secretDir = await mkdtemp(join(tmpdir(), 'scalar-mock-secret-'))
    const secretFile = join(secretDir, 'secret.json')
    await writeFile(secretFile, JSON.stringify({ secret: 'do-not-leak' }))

    try {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: { schemas: { Leaked: { $ref: secretFile } } },
      }

      const result = await processOpenApiDocument(document)

      // The out-of-tree file must not be inlined into the bundled document.
      expect(JSON.stringify(result)).not.toContain('do-not-leak')
    } finally {
      await rm(secretDir, { recursive: true, force: true })
    }
  })
})
