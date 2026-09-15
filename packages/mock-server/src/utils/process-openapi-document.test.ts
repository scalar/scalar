import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { processOpenApiDocument } from './process-openapi-document'

describe('processOpenApiDocument', () => {
  it('resolves a schema reference to the document declared by $self', async () => {
    const result = await processOpenApiDocument({
      openapi: '3.2.1',
      $self: 'https://example.com/api.json',
      info: { title: 'Example', version: '1' },
      paths: {},
      components: {
        schemas: {
          Value: { type: 'string' },
          Model: { $id: 'model.json', properties: { value: { $ref: 'api.json#/components/schemas/Value' } } },
        },
      },
    })
    expect(result.components?.schemas?.Model).toStrictEqual({
      $id: 'model.json',
      properties: {
        value: {
          $ref: 'https://example.com/api.json#/components/schemas/Value',
          '$ref-value': { type: 'string' },
        },
      },
    })
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
