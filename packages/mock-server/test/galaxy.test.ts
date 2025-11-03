import { describe, expect, it } from 'vitest'

import galaxy from '../../galaxy/src/documents/3.1.yaml?raw'
import { createMockServer } from '../src/create-mock-server'

describe('createMockServer', () => {
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
