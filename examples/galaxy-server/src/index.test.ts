import { describe, expect, it } from 'vitest'

import app from './index'

// TODO: Blocked by https://github.com/cloudflare/workers-sdk/issues/6071
describe('index', () => {
  it('GET /planets -> JSON', async () => {
    const response = await app.request('/planets')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })
})
