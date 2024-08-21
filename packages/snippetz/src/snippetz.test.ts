import { HarRequest } from 'httpsnippet-lite'
import { describe, expect, it } from 'vitest'

import { snippetz } from './snippetz'

describe('snippetz', async () => {
  it('returns code for undici', async () => {
    const snippet = snippetz().print('node', 'undici', {
      url: 'https://example.com',
    })

    expect(snippet).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('loads some clients by default', async () => {
    const targets = snippetz().targets()
    expect(targets).toStrictEqual(['node', 'js'])

    const clients = snippetz().clients()
    expect(clients).toStrictEqual([
      'undici',
      'fetch',
      'fetch',
      'ofetch',
      'ofetch',
    ])
  })
})

describe('plugins', async () => {
  it('returns true if it has the plugin', async () => {
    const result = snippetz().plugins()

    expect(result).toStrictEqual([
      {
        target: 'node',
        client: 'undici',
      },
      {
        target: 'node',
        client: 'fetch',
      },
      {
        target: 'js',
        client: 'fetch',
      },
      {
        target: 'js',
        client: 'ofetch',
      },
      {
        target: 'node',
        client: 'ofetch',
      },
    ])
  })
})

describe('hasPlugin', async () => {
  it('returns true if it has the plugin', async () => {
    const result = snippetz().hasPlugin('node', 'undici')

    expect(result).toBe(true)
  })

  it('returns false if it doesn’t know the plugin', async () => {
    const result = snippetz().hasPlugin('node', 'fantasy')

    expect(result).toBe(false)
  })
})
