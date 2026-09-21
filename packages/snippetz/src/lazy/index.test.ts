import { describe, expect, it } from 'vitest'

import { clients } from '../clients'
import { clientMetadata, loadPlugin } from './index'

describe('lazy', () => {
  it('preserves every client label, default and ordering without its implementation', () => {
    expect(clientMetadata).toStrictEqual(
      clients.map((group) => ({
        key: group.key,
        title: group.title,
        default: group.default,
        clients: group.clients.map(({ target, client, title }) => ({ target, client, title })),
      })),
    )
  })

  it.each(clients.flatMap((group) => group.clients))('loads $target/$client with identical output', async (plugin) => {
    const loaded = await loadPlugin(`${plugin.target}/${plugin.client}`)
    const request = { url: 'https://example.com/pets', method: 'GET', headers: [], queryString: [] }
    expect(loaded?.generate(request)).toBe(plugin.generate(request))
  })

  it('shares concurrent requests', async () => {
    const first = loadPlugin('shell/curl')
    const second = loadPlugin('shell/curl')
    expect(first).toBe(second)
    expect((await first)?.client).toBe('curl')
  })

  it('rejects unknown client identifiers without importing a generator', async () => {
    expect(await loadPlugin('shell/missing')).toBeUndefined()
    expect(await loadPlugin('constructor')).toBeUndefined()
  })
})
