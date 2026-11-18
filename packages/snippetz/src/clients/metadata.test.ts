import { describe, expect, it } from 'vitest'

import { clients } from './index'
import { clientsMetadata } from './metadata'

describe('metadata', () => {
  it('matches the targets and clients of the plugins, in the same order', () => {
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
