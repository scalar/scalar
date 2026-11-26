import { describe, expect, it } from 'vitest'

import { clients } from './index'
import { clientsMetadata } from './metadata'

describe('metadata', () => {
  it('matches the plugins each entry resolves to, titles included', () => {
    // `clients` is built from this list, so this checks the plugin behind each entry: that it is the
    // plugin for that target and client, and that the title the selector shows is the plugin's own.
    const fromPlugins = clients.map((target) => ({
      key: target.key,
      title: target.title,
      default: target.default,
      clients: target.clients.map(({ target, client, title }) => ({ target, client, title })),
    }))

    expect(clientsMetadata).toStrictEqual(fromPlugins)
  })

  it('lists the default client of every target', () => {
    for (const target of clientsMetadata) {
      expect(target.clients.map(({ client }) => client)).toContain(target.default)
    }
  })
})
