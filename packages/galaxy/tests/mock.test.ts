import { createMockServer } from '@scalar/mock-server'
import { describe, expect, it } from 'vitest'

import galaxy from '../src/specifications/3.1.yaml?raw'

describe('createMockServer', () => {
  it('GET /planets -> example JSON', async () => {
    const server = await createMockServer({
      specification: galaxy,
    })

    const response = await server.request('/planets')

    expect(response.status).toBe(200)

    expect(await response.json()).toMatchObject({
      data: [
        {
          creator: {
            email: 'marc@scalar.com',
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
