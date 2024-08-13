import { describe, expect, it } from 'vitest'

import app from './index'

describe('index', () => {
  it('GET /foobar -> JSON', async () => {
    const response = await app.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      path: '/foobar',
    })
  })
})
