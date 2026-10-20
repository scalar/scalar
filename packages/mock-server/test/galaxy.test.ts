import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import galaxy from '../../galaxy/src/documents/3.1.yaml?raw'
import galaxyAsyncApi from '../../galaxy/src/documents/asyncapi/3.0.yaml?raw'
import { createMockServer } from '../src/create-mock-server'

describe('createMockServer', () => {
  it('serves the refresh endpoint advertised by the Galaxy AsyncAPI document', async () => {
    const document: AsyncApiDocument = parse(galaxyAsyncApi)
    const scheme = getResolvedRef(getResolvedRef(document.components)?.securitySchemes?.oauth2)
    const flow = getResolvedRef(getResolvedRef(scheme?.flows)?.authorizationCode)
    const server = await createMockServer({ document: galaxy, logger: false })
    const response = await server.request(new URL(flow?.refreshUrl ?? '').pathname, {
      method: 'POST',
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: 'example-refresh-token', client_id: '' }),
    })

    expect(response.status).toBe(200)
    expect((await response.json()).access_token).toBe('super-secret-access-token')
  })

  it('GET /planets -> example JSON', async () => {
    const server = await createMockServer({
      document: galaxy,
    })

    const response = await server.request('/planets')

    expect(response.status).toBe(200)

    expect(await response.json()).toMatchObject({
      data: [
        {
          creator: {
            id: 1,
            name: 'Marc',
          },
          description: 'The red planet',
          id: 1,
          image: 'https://cdn.scalar.com/photos/mars.jpg',
          name: 'Mars',
        },
      ],
      meta: {
        limit: 10,
        next: '/planets?limit=10&offset=10',
        offset: 0,
        total: 100,
      },
    })
  })
})
