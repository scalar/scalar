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

    expect(targets).toEqual(
      expect.arrayContaining(['node', 'js', 'shell', 'php']),
    )

    const clients = snippetz().clients()

    expect(clients).toContain('undici')
    expect(clients).toContain('fetch')
    expect(clients).toContain('ofetch')
    expect(clients).toContain('curl')
  })
})

describe('plugins', async () => {
  it('returns true if it has the plugin', async () => {
    const result = snippetz().plugins()

    expect(result).toEqual(
      expect.arrayContaining([
        {
          target: 'node',
          client: 'undici',
        },
        {
          target: 'node',
          client: 'fetch',
        },
        {
          target: 'shell',
          client: 'curl',
        },
      ]),
    )
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
