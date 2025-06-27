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
    expect(snippetz().clients()).toEqual(
      expect.arrayContaining([
        {
          key: 'node',
          title: 'Node.js',
          default: 'fetch',
          clients: expect.arrayContaining([
            expect.objectContaining({
              client: 'undici',
            }),
            expect.objectContaining({
              client: 'fetch',
            }),
          ]),
        },
        {
          key: 'shell',
          title: 'Shell',
          default: 'curl',
          clients: expect.arrayContaining([
            expect.objectContaining({
              client: 'curl',
            }),
            expect.objectContaining({
              client: 'wget',
            }),
            expect.objectContaining({
              client: 'httpie',
            }),
          ]),
        },
      ]),
    )
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

  it("returns false if it doesn't know the plugin", async () => {
    const result = snippetz().hasPlugin('node', 'fantasy')

    expect(result).toBe(false)
  })
})
